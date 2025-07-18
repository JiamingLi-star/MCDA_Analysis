const { useState, useEffect, useRef } = React;

function App() {
  // Data state management
  const [classData, setClassData] = useState([]); // Structured data by class/category
  const [projectNames, setProjectNames] = useState([]); // Project names for X-axis and sliders
  const [weights, setWeights] = useState({}); // Store weights for each project
  const [initialWeights, setInitialWeights] = useState({}); // Store initial weights
  const [sliderMaxMap, setSliderMaxMap] = useState({}); // Store maximum values for sliders
  const [sliderMinMap, setSliderMinMap] = useState({}); // Store minimum values for sliders
  const [initialClassData, setInitialClassData] = useState([]); // Store initial state
  const [tempSliderValues, setTempSliderValues] = useState({}); // Store temporary slider values
  const [inputValues, setInputValues] = useState({}); // Store input field raw strings
  const [lockedValues, setLockedValues] = useState({}); // Track locked input items
  const [lockedWeights, setLockedWeights] = useState({}); // Track locked weights
  const [weightInputValues, setWeightInputValues] = useState({}); // Store weight input raw values
  
  // UI and file management
  const debounceTimerRef = useRef(null);
  const [availableFiles, setAvailableFiles] = useState([]); // Available Excel files in data folder
  const [selectedFile, setSelectedFile] = useState("");
  const svgRef = useRef();
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'radar'
  
  // MCDA method selection
  const [mcdaMethod, setMcdaMethod] = useState('weighted_sum'); // 'weighted_sum' | 'cp' | 'topsis'
  const [cpP, setCpP] = useState(2); // CP method p parameter
  const [topsisIdealType, setTopsisIdealType] = useState('benefit'); // 'benefit' | 'cost'

  // Fetch Excel files from data folder
  useEffect(() => {
    const fetchFileList = async () => {
      try {
        console.log('Fetching file list...');
        const response = await fetch('/api/files');
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const files = await response.json();
          console.log('Files from API:', files);
          const excelFiles = files.filter(file => 
            file.endsWith('.xlsx') || file.endsWith('.xls')
          );
          console.log('Filtered Excel files:', excelFiles);
          setAvailableFiles(excelFiles);
          if (excelFiles.length > 0 && !selectedFile) {
            setSelectedFile(excelFiles[0]); // Default to first file
          }
        } else {
          console.warn('API unavailable, using complete file list');
        }
      } catch (error) {
        console.error('Error fetching file list:', error);
      }
    };
    fetchFileList();
  }, []);

  // Calculate weighted sum score
  const calculateWeightedScore = (projectValues, weights) => {
    let totalScore = 0;
    Object.keys(projectValues).forEach(projectName => {
      const weight = weights[projectName] || 0;
      const value = projectValues[projectName] || 0;
      totalScore += value * weight;
    });
    return totalScore;
  };

  // Calculate Pareto dominance relationships
  const calculateParetoDominance = (data) => {
    const dominanceInfo = [];
    
    for (let i = 0; i < data.length; i++) {
      const dominatedBy = [];
      const dominates = [];
      
      for (let j = 0; j < data.length; j++) {
        if (i === j) continue;
        
        const classI = data[i];
        const classJ = data[j];
        
        // Check if classI dominates classJ
        let dominatesJ = true;
        let isDominatedByJ = true;
        let hasStrictlyBetter = false;
        let hasStrictlyWorse = false;
        
        Object.keys(classI.projectValues).forEach(projectName => {
          const valueI = classI.projectValues[projectName];
          const valueJ = classJ.projectValues[projectName];
          
          if (valueI > valueJ) {
            hasStrictlyBetter = true;
            isDominatedByJ = false;
          } else if (valueI < valueJ) {
            hasStrictlyWorse = true;
            dominatesJ = false;
          }
        });
        
        if (dominatesJ && hasStrictlyBetter) {
          dominates.push(classJ.name);
        }
        if (isDominatedByJ && hasStrictlyWorse) {
          dominatedBy.push(classJ.name);
        }
      }
      
      dominanceInfo.push({
        className: data[i].name,
        dominates: dominates,
        dominatedBy: dominatedBy,
        isParetoOptimal: dominatedBy.length === 0
      });
    }
    
    return dominanceInfo;
  };

  // CP (Compromise Programming) method calculation
  const calculateCPScore = (projectValues, weights, data, p = 2) => {
    // Calculate distances to ideal and negative ideal solutions
    let distanceToIdeal = 0;
    let distanceToNegativeIdeal = 0;
    
    projectNames.forEach(projectName => {
      const weight = weights[projectName] || 0;
      const value = projectValues[projectName] || 0;
      
      // Fixed ideal point at 100, negative ideal point at 0
      const ideal = 100;
      const negativeIdeal = 0;
      
      // Normalization
      const normalizedValue = (value - negativeIdeal) / (ideal - negativeIdeal);
      const normalizedIdeal = 1;
      const normalizedNegativeIdeal = 0;
      
      distanceToIdeal += weight * Math.pow(Math.abs(normalizedValue - normalizedIdeal), p);
      distanceToNegativeIdeal += weight * Math.pow(Math.abs(normalizedValue - normalizedNegativeIdeal), p);
    });
    
    // Calculate CP score (lower is better)
    const cpScore = distanceToIdeal / (distanceToIdeal + distanceToNegativeIdeal);
    return cpScore;
  };

  // TOPSIS method calculation
  const calculateTopsScore = (projectValues, weights, data, idealType = 'benefit') => {
    // Build decision matrix (using fixed ideal point 100 and negative ideal point 0)
    const decisionMatrix = data.map(item => 
      projectNames.map(projectName => item.projectValues[projectName] || 0)
    );
    
    // Normalize decision matrix (relative to fixed ideal point 100)
    const normalizedMatrix = decisionMatrix.map(row => {
      return row.map(val => val / 100); // Normalize relative to ideal point 100
    });
    
    // Calculate weighted normalized matrix
    const weightedMatrix = normalizedMatrix.map(row => 
      row.map((val, index) => val * (weights[projectNames[index]] || 0))
    );
    
    // Determine ideal and negative ideal solutions (based on fixed ideal point)
    const idealSolution = [];
    const negativeIdealSolution = [];
    
    for (let j = 0; j < projectNames.length; j++) {
      if (idealType === 'benefit') {
        idealSolution[j] = weights[projectNames[j]] || 0; // Ideal point normalized to 1, multiplied by weight
        negativeIdealSolution[j] = 0; // Negative ideal point normalized to 0
      } else {
        idealSolution[j] = 0; // Cost type: ideal point is 0
        negativeIdealSolution[j] = weights[projectNames[j]] || 0; // Negative ideal point is weight value
      }
    }
    
    // Find current solution position in matrix
    const currentIndex = data.findIndex(item => 
      Object.keys(item.projectValues).every(key => 
        item.projectValues[key] === projectValues[key]
      )
    );
    
    if (currentIndex === -1) return 0;
    
    const currentRow = weightedMatrix[currentIndex];
    
    // Calculate distances to ideal and negative ideal solutions
    let distanceToIdeal = 0;
    let distanceToNegativeIdeal = 0;
    
    for (let j = 0; j < projectNames.length; j++) {
      distanceToIdeal += Math.pow(currentRow[j] - idealSolution[j], 2);
      distanceToNegativeIdeal += Math.pow(currentRow[j] - negativeIdealSolution[j], 2);
    }
    
    distanceToIdeal = Math.sqrt(distanceToIdeal);
    distanceToNegativeIdeal = Math.sqrt(distanceToNegativeIdeal);
    
    // Calculate TOPSIS score (higher is better)
    const topsScore = distanceToNegativeIdeal / (distanceToIdeal + distanceToNegativeIdeal);
    return topsScore;
  };

  // Recalculate ranks based on selected MCDA method
  const recalculateRanks = (data, weights) => {
    let scores = [];
    
    if (mcdaMethod === 'weighted_sum') {
      // Weighted sum method
      scores = data.map(classItem => ({
        name: classItem.name,
        score: calculateWeightedScore(classItem.projectValues, weights)
      }));
    } else if (mcdaMethod === 'cp') {
      // CP method
      scores = data.map(classItem => ({
        name: classItem.name,
        score: calculateCPScore(classItem.projectValues, weights, data, cpP)
      }));
    } else if (mcdaMethod === 'topsis') {
      // TOPSIS method
      scores = data.map(classItem => ({
        name: classItem.name,
        score: calculateTopsScore(classItem.projectValues, weights, data, topsisIdealType)
      }));
    }
    
    // Determine sorting direction based on method type
    const isDescending = mcdaMethod === 'weighted_sum' || mcdaMethod === 'topsis';
    const sorted = [...scores].sort((a, b) => 
      isDescending ? b.score - a.score : a.score - b.score
    );
    
    let currentRank = 1;
    let currentScore = null;
    const nameToRank = {};
    
    sorted.forEach((item, idx) => {
      if (currentScore !== null && item.score !== currentScore) {
        currentRank = idx + 1;
      }
      currentScore = item.score;
      nameToRank[item.name] = currentRank;
    });
    
    // Return original order, only update currentRank
    return data.map(classItem => ({
      ...classItem,
      currentRank: nameToRank[classItem.name] || classItem.currentRank
    }));
  };

  // Load Excel data
  useEffect(() => {
    if (!selectedFile) return;

    const loadExcelData = async () => {
      try {
        const response = await fetch(`/data/${selectedFile}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // Read data from the first sheet
        const sheet1Name = workbook.SheetNames[0];
        const worksheet1 = workbook.Sheets[sheet1Name];
        
        // Dynamically read all data without range limitation
        const rawDataSheet1 = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
        
        if (rawDataSheet1.length < 4) {
          console.warn("Insufficient data in Sheet 1, at least 4 rows needed (title row, column names row, at least one data row, weights row).");
          return;
        }

        // Read column names from A3 row (index 2)
        const columnNamesRow = rawDataSheet1[2]; // A3 row
        if (!columnNamesRow || columnNamesRow.length < 2) {
          console.warn("Insufficient data in A3 row (column names row).");
          return;
        }
        
        // Extract project names (from B3, excluding the last column)
        const extractedProjectNames = columnNamesRow.slice(1, -1); // B3 to second-to-last column
        
        // Read weights (last row)
        const weightsRow = rawDataSheet1[rawDataSheet1.length - 1]; // Last row
        const weightsMap = {};
        let totalWeight = 0;
        
        extractedProjectNames.forEach((projectName, index) => {
          const weight = parseFloat(weightsRow[index + 1]) || 0; // Starting from B column
          weightsMap[projectName] = weight;
          totalWeight += weight;
        });
        
        // Normalize weights to sum to 1
        if (totalWeight > 0) {
          extractedProjectNames.forEach(projectName => {
            weightsMap[projectName] = weightsMap[projectName] / totalWeight;
          });
        }
        
        setWeights(weightsMap);
        setInitialWeights({...weightsMap}); // Save initial weights

        // Initialize weight input values
        const weightInputs = {};
        extractedProjectNames.forEach(projectName => {
          weightInputs[projectName] = weightsMap[projectName] ? String(weightsMap[projectName]) : '0';
        });
        setWeightInputValues(weightInputs);

        // Filter out projects with zero weight
        const validProjectNames = extractedProjectNames.filter(name => weightsMap[name] > 0);
        setProjectNames(validProjectNames);

        // Extract class names (from row 4 to second-to-last row)
        const dataRows = rawDataSheet1.slice(3, -1); // Row 4 to second-to-last row
        const extractedClassNames = dataRows.map(row => row[0]).filter(name => name && name !== ''); // A column, filter empty values

        // Set slider range from 0 to 100
        const sliderMax = {};
        const sliderMin = {};
        validProjectNames.forEach(projectName => {
          sliderMax[projectName] = 100;
          sliderMin[projectName] = 0;
        });
        setSliderMaxMap(sliderMax);
        setSliderMinMap(sliderMin);

        // Build initial data
        const initialClassData = [];
        dataRows.forEach((dataRow, rowIndex) => {
          const className = dataRow[0];
          if (!className || className === '') return; // Skip empty rows
          
          const projectValuesForClass = {};
          validProjectNames.forEach(projectName => {
            const colIndex = extractedProjectNames.indexOf(projectName) + 1;
            projectValuesForClass[projectName] = parseFloat(dataRow[colIndex]) || 0;
          });
          
          initialClassData.push({
            name: className,
            projectValues: projectValuesForClass,
            currentRank: 1 // Initial rank set to 1, will be recalculated by algorithm
          });
        });

        // Maintain original order from Excel table, no sorting
        // Calculate initial ranks based on initial weights
        const initialDataWithRanks = recalculateRanks(initialClassData, weightsMap);
        setClassData(initialDataWithRanks);
        setInitialClassData(initialDataWithRanks.map(item => ({
          ...item,
          projectValues: { ...item.projectValues },
        })));

      } catch (error) {
        console.error("Error loading or parsing Excel file:", error);
        setClassData([]);
        setProjectNames([]);
        setWeights({});
        setSliderMaxMap({});
        setSliderMinMap({});
      }
    };
    loadExcelData();
  }, [selectedFile]);

  // Chart Y-axis supports negative values
  useEffect(() => {
    if (classData.length === 0 || projectNames.length === 0) {
      console.log("Skipping chart rendering: classData or projectNames is empty.", { classData, projectNames });
      return;
    }

    classData.forEach(classItem => {
      const svgId = `chart-${classItem.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, '')}`;
      const svg = d3.select(`#${svgId}`);
      
      if (svg.empty()) {
        console.warn(`SVG element with ID '${svgId}' not found, class: ${classItem.name}`);
        return; // Skip this chart if SVG element not found
      }

      const width = 450;
    const height = 300;
      const margin = { top: 30, right: 50, bottom: 150, left: 50 };

    svg.attr("width", width).attr("height", height);

      // Prepare chart data for this class
      const currentClassChartData = projectNames.map(projectName => ({
        name: projectName,
        value: classItem.projectValues[projectName] !== undefined ? classItem.projectValues[projectName] : 0,
      }));

      // Calculate Y-axis min and max values, support negative values
      const yMin = Math.min(0, d3.min(currentClassChartData, d => d.value));
      const yMax = d3.max(currentClassChartData, d => d.value) * 1.1;

    const x = d3
      .scaleBand()
        .domain(currentClassChartData.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
        .domain([yMin, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

      svg.selectAll("*").remove();

      // Draw bar chart
    svg
      .selectAll("rect")
        .data(currentClassChartData)
      .join("rect")
        .attr("x", (d) => x(d.name))
        .attr("y", (d) => d.value >= 0 ? y(d.value) : y(0))
        .attr("height", (d) => Math.abs(y(d.value) - y(0)))
      .attr("width", x.bandwidth())
      .attr("fill", "#4f46e5")
      .attr("class", "transition duration-300");

      // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("font-size", d => d.length > 12 ? "10px" : "12px")
        .attr("transform", "rotate(-60)")
        .style("text-anchor", "end");

      // Y axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d => d3.format(".0f")(d)))
      .selectAll("text")
        .style("font-size", "10px");

      // Remove chart title, keep only external card title
    });

  }, [classData, projectNames]);

  // Weight input change handler
  const handleWeightInputChange = (projectName, value) => {
    setWeightInputValues(prev => ({
      ...prev,
      [projectName]: value
    }));
  };

  // Weight input blur handler
  const handleWeightInputBlur = (projectName) => {
    const inputValue = weightInputValues[projectName];
    const parsedWeight = parseFloat(inputValue);
    
    if (isNaN(parsedWeight) || parsedWeight < 0) {
      // If input is invalid, restore to current weight value
      setWeightInputValues(prev => ({
        ...prev,
        [projectName]: String(weights[projectName] || 0)
      }));
      return;
    }
    
    const clampedWeight = Math.max(0, Math.min(1, parsedWeight));
    
    setWeights(prev => {
      const currentWeights = { ...prev };
      const allProjectNames = Object.keys(currentWeights);
      
      // Separate locked and unlocked weights
      const lockedProjectNames = allProjectNames.filter(name => 
        name !== projectName && lockedWeights[name]
      );
      const unlockedProjectNames = allProjectNames.filter(name => 
        name !== projectName && !lockedWeights[name]
      );
      
      // Calculate sum of locked weights
      const lockedWeightsSum = lockedProjectNames.reduce((sum, name) => 
        sum + (currentWeights[name] || 0), 0
      );
      
      // Check if input weight plus locked weights sum exceeds 1
      if (clampedWeight + lockedWeightsSum > 1) {
        // If exceeds 1, adjust input weight to maximum possible value
        const maxPossibleWeight = Math.max(0, 1 - lockedWeightsSum);
        const adjustedWeight = Math.min(clampedWeight, maxPossibleWeight);
        
        const newWeights = { ...currentWeights };
        newWeights[projectName] = adjustedWeight;
        
        // Set all unlocked weights to 0
        unlockedProjectNames.forEach(name => {
          newWeights[name] = 0;
        });
        
        // Update input value display
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(adjustedWeight)
        }));
        
        return newWeights;
      }
      
      // Calculate remaining weight (subtract input weight and locked weights)
      const remainingWeight = 1 - clampedWeight - lockedWeightsSum;
      
      const newWeights = { ...currentWeights };
      newWeights[projectName] = clampedWeight;
      
      // If no unlocked projects, return directly
      if (unlockedProjectNames.length === 0) {
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(clampedWeight)
        }));
        return newWeights;
      }
      
      // If remaining weight is 0 or negative, set all unlocked weights to 0
      if (remainingWeight <= 0) {
        unlockedProjectNames.forEach(name => {
          newWeights[name] = 0;
        });
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(clampedWeight),
          ...Object.fromEntries(unlockedProjectNames.map(name => [name, '0']))
        }));
        return newWeights;
      }
      
      // If unlocked weights sum is 0, distribute remaining weight equally
      const unlockedWeightsSum = unlockedProjectNames.reduce((sum, name) => 
        sum + (currentWeights[name] || 0), 0
      );
      
      if (unlockedWeightsSum === 0) {
        const averageWeight = remainingWeight / unlockedProjectNames.length;
        unlockedProjectNames.forEach(name => {
          newWeights[name] = averageWeight;
        });
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(clampedWeight),
          ...Object.fromEntries(unlockedProjectNames.map(name => [name, String(averageWeight)]))
        }));
        return newWeights;
      }
      
      // Scale unlocked weights proportionally
      const scaleFactor = remainingWeight / unlockedWeightsSum;
      unlockedProjectNames.forEach(name => {
        newWeights[name] = (newWeights[name] || 0) * scaleFactor;
      });
      
      setWeightInputValues(prev => ({
        ...prev,
        [projectName]: String(clampedWeight),
        ...Object.fromEntries(unlockedProjectNames.map(name => [name, String(newWeights[name])]))
      }));
      
      return newWeights;
    });
  };

  // Weight slider change handler
  const handleWeightSliderChange = (projectName, value) => {
    const sliderWeight = parseFloat(value);
    if (isNaN(sliderWeight)) return;
    
    setWeights(prev => {
      const currentWeights = { ...prev };
      const allProjectNames = Object.keys(currentWeights);
      
      // Separate locked and unlocked weights
      const lockedProjectNames = allProjectNames.filter(name => 
        name !== projectName && lockedWeights[name]
      );
      const unlockedProjectNames = allProjectNames.filter(name => 
        name !== projectName && !lockedWeights[name]
      );
      
      // Calculate sum of locked weights
      const lockedWeightsSum = lockedProjectNames.reduce((sum, name) => 
        sum + (currentWeights[name] || 0), 0
      );
      
      // Check if slider weight plus locked weights sum exceeds 1
      if (sliderWeight + lockedWeightsSum > 1) {
        const maxPossibleWeight = Math.max(0, 1 - lockedWeightsSum);
        const adjustedWeight = Math.min(sliderWeight, maxPossibleWeight);
        
        const newWeights = { ...currentWeights };
        newWeights[projectName] = adjustedWeight;
        
        // Set all unlocked weights to 0
        unlockedProjectNames.forEach(name => {
          newWeights[name] = 0;
        });
        
        // Update input value display
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(adjustedWeight),
          ...Object.fromEntries(unlockedProjectNames.map(name => [name, '0']))
        }));
        
        return newWeights;
      }
      
      // Calculate remaining weight
      const remainingWeight = 1 - sliderWeight - lockedWeightsSum;
      
      const newWeights = { ...currentWeights };
      newWeights[projectName] = sliderWeight;
      
      if (unlockedProjectNames.length === 0) {
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(sliderWeight)
        }));
        return newWeights;
      }
      
      if (remainingWeight <= 0) {
        unlockedProjectNames.forEach(name => {
          newWeights[name] = 0;
        });
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(sliderWeight),
          ...Object.fromEntries(unlockedProjectNames.map(name => [name, '0']))
        }));
        return newWeights;
      }
      
      const unlockedWeightsSum = unlockedProjectNames.reduce((sum, name) => 
        sum + (currentWeights[name] || 0), 0
      );
      
      if (unlockedWeightsSum === 0) {
        const averageWeight = remainingWeight / unlockedProjectNames.length;
        unlockedProjectNames.forEach(name => {
          newWeights[name] = averageWeight;
        });
        setWeightInputValues(prev => ({
          ...prev,
          [projectName]: String(sliderWeight),
          ...Object.fromEntries(unlockedProjectNames.map(name => [name, String(averageWeight)]))
        }));
        return newWeights;
      }
      
      const scaleFactor = remainingWeight / unlockedWeightsSum;
      unlockedProjectNames.forEach(name => {
        newWeights[name] = (newWeights[name] || 0) * scaleFactor;
      });
      
      setWeightInputValues(prev => ({
        ...prev,
        [projectName]: String(sliderWeight),
        ...Object.fromEntries(unlockedProjectNames.map(name => [name, String(newWeights[name])]))
      }));
      
      return newWeights;
    });
  };

  // Recalculate ranks when weights or MCDA method changes
  useEffect(() => {
    if (classData.length > 0 && Object.keys(weights).length > 0) {
      setClassData(prevData => recalculateRanks(prevData, weights));
    }
  }, [weights, mcdaMethod, cpP, topsisIdealType]);

  // Toggle weight lock status
  const handleToggleWeightLock = (projectName) => {
    setLockedWeights(prev => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
  };

  // Reset weights to initial values
  const handleResetWeights = () => {
    setWeights({...initialWeights});
    setLockedWeights({}); // Also reset lock status
    setClassData(prevData => recalculateRanks(prevData, initialWeights));
    
    // Reset weight input values
    const weightInputs = {};
    Object.keys(initialWeights).forEach(projectName => {
      weightInputs[projectName] = initialWeights[projectName] ? String(initialWeights[projectName]) : '0';
    });
    setWeightInputValues(weightInputs);
  };

  // Toggle lock status for data inputs
  const handleToggleLock = (className, projectName) => {
    setLockedValues(prev => ({
      ...prev,
      [`${className}-${projectName}`]: !prev[`${className}-${projectName}`]
    }));
  };

  // Modified handleSliderChange and handleInputBlur with auto-restore logic
  const resetUnLockedAndUnfocused = (currentKey) => {
    setClassData(prevData => {
      const updatedData = prevData.map(classItem => {
        const newProjectValues = { ...classItem.projectValues };
        Object.keys(newProjectValues).forEach(projectName => {
          const key = `${classItem.name}-${projectName}`;
          if (key !== currentKey && !lockedValues[key]) {
            // Restore to initial value
            const initialClass = initialClassData.find(init => init.name === classItem.name);
            if (initialClass) {
              newProjectValues[projectName] = initialClass.projectValues[projectName];
            }
          }
        });
        return { ...classItem, projectValues: newProjectValues };
      });
      
      // Recalculate ranks (only when there are data changes)
      const hasChanges = updatedData.some(classItem => {
        const initialClass = initialClassData.find(init => init.name === classItem.name);
        if (!initialClass) return false;
        return Object.keys(classItem.projectValues).some(projectName => 
          classItem.projectValues[projectName] !== initialClass.projectValues[projectName]
        );
      });
      
      if (hasChanges) {
        return recalculateRanks(updatedData, weights);
      } else {
        // If no changes, recalculate ranks
        return recalculateRanks(updatedData, weights);
      }
    });
    
    setInputValues(prev => {
      const newInputValues = { ...prev };
      Object.keys(newInputValues).forEach(key => {
        if (key !== currentKey && !lockedValues[key]) {
          // Restore to initial value
          const [className, ...projectArr] = key.split('-');
          const projectName = projectArr.join('-');
          const initialClass = initialClassData.find(init => init.name === className);
          if (initialClass) {
            newInputValues[key] = initialClass.projectValues[projectName] !== undefined ? String(initialClass.projectValues[projectName]) : '';
          }
        }
      });
      return newInputValues;
    });
  };

  const handleSliderChange = (className, projectName, newValue) => {
    const key = `${className}-${projectName}`;
    resetUnLockedAndUnfocused(key);
    const updatedValue = parseFloat(newValue);
    setInputValues(prev => ({
      ...prev,
      [key]: newValue
    }));
    if (isNaN(updatedValue)) return;
    
    // Limit value to 0-100 range
    const clampedValue = Math.max(0, Math.min(100, updatedValue));
    
    setTempSliderValues(prev => ({
      ...prev,
      [key]: clampedValue
    }));
    setClassData(prevData => prevData.map(classItem => {
      if (classItem.name === className) {
        const newProjectValues = { ...classItem.projectValues };
        newProjectValues[projectName] = clampedValue;
        return { ...classItem, projectValues: newProjectValues };
      }
      return classItem;
    }));
  };

  const handleInputChange = (className, projectName, value) => {
    setInputValues(prev => ({
      ...prev,
      [`${className}-${projectName}`]: value
    }));
  };

  const handleInputBlur = (className, projectName) => {
    const key = `${className}-${projectName}`;
    resetUnLockedAndUnfocused(key);
    const rawValue = inputValues[key];
    const parsed = parseFloat(rawValue);
    if (rawValue === '' || rawValue === '-' || isNaN(parsed)) return;
    
    // Limit value to 0-100 range
    const clampedValue = Math.max(0, Math.min(100, parsed));
    
    setTempSliderValues(prev => ({
      ...prev,
      [key]: clampedValue
    }));
    
    // Update input field display value
    setInputValues(prev => ({
      ...prev,
      [key]: String(clampedValue)
    }));
    
    // Update data and recalculate ranks
    setClassData(prevData => {
      const updatedData = prevData.map(classItem => {
        if (classItem.name === className) {
          const newProjectValues = { ...classItem.projectValues };
          newProjectValues[projectName] = clampedValue;
          return {
            ...classItem,
            projectValues: newProjectValues
          };
        }
        return classItem;
      });
      
      // Recalculate ranks for all classes
      return recalculateRanks(updatedData, weights);
    });
  };

  const handleSliderChangeEnd = (className, projectName) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const finalValue = tempSliderValues[`${className}-${projectName}`];
      if (finalValue === undefined) return;
      
      // Limit value to 0-100 range
      const clampedValue = Math.max(0, Math.min(100, finalValue));
      
      // Update data and recalculate ranks
      setClassData(prevData => {
        const updatedData = prevData.map(classItem => {
          if (classItem.name === className) {
            const newProjectValues = { ...classItem.projectValues };
            newProjectValues[projectName] = clampedValue;
            return {
              ...classItem,
              projectValues: newProjectValues
            };
          }
          return classItem;
        });
        
        // Recalculate ranks for all classes
        return recalculateRanks(updatedData, weights);
      });
    }, 300);
  };

  const handleReset = () => {
    const resetData = initialClassData.map(item => ({
      ...item,
      projectValues: { ...item.projectValues },
    }));
    
    // Recalculate ranks based on current weights and MCDA method
    const resetDataWithRanks = recalculateRanks(resetData, weights);
    setClassData(resetDataWithRanks);
    
    // Reset weights
    setWeights({...initialWeights});
    
    // Reset inputValues
    const newInputValues = {};
    resetData.forEach(classItem => {
      Object.keys(classItem.projectValues).forEach(projectName => {
        newInputValues[`${classItem.name}-${projectName}`] = String(classItem.projectValues[projectName]);
      });
    });
    setInputValues(newInputValues);
    // Reset lock status
    setLockedValues({});
    setLockedWeights({});
  };

  // Initialize input values when data changes
  useEffect(() => {
    if (classData.length > 0 && projectNames.length > 0) {
      const newInputValues = {};
      classData.forEach(classItem => {
        projectNames.forEach(projectName => {
          newInputValues[`${classItem.name}-${projectName}`] = classItem.projectValues[projectName] !== undefined ? String(classItem.projectValues[projectName]) : '';
        });
      });
      setInputValues(newInputValues);
    }
  }, [classData, projectNames]);

  // D3 Stacked Chart Effect (Bar/Line/Radar)
  useEffect(() => {
    if (classData.length === 0 || projectNames.length === 0) return;
    const svg = d3.select("#stacked-bar-chart");
    svg.selectAll("*").remove();
    const width = 700;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 80, left: 60 };
    
    // Prepare data based on selected MCDA method
    let stackedData;
    if (mcdaMethod === 'weighted_sum') {
      // Weighted sum method
      stackedData = classData.map(classItem => {
        const row = { class: classItem.name };
        projectNames.forEach(projectName => {
          row[projectName] = (classItem.projectValues[projectName] || 0) * (weights[projectName] || 0);
        });
        return row;
      });
    } else if (mcdaMethod === 'cp') {
      // CP method - show individual criteria contributions
      stackedData = classData.map(classItem => {
        const row = { class: classItem.name };
        projectNames.forEach(projectName => {
          const value = classItem.projectValues[projectName] || 0;
          const weight = weights[projectName] || 0;
          // Calculate normalized contribution for CP (relative to fixed ideal point 100)
          const normalizedValue = value / 100; // Normalize relative to ideal point 100
          row[projectName] = normalizedValue * weight;
        });
        return row;
      });
    } else if (mcdaMethod === 'topsis') {
      // TOPSIS method - show individual criteria contributions
      stackedData = classData.map(classItem => {
        const row = { class: classItem.name };
        projectNames.forEach(projectName => {
          const value = classItem.projectValues[projectName] || 0;
          const weight = weights[projectName] || 0;
          // Calculate normalized contribution for TOPSIS (relative to fixed ideal point 100)
          const normalizedValue = value / 100; // Normalize relative to ideal point 100
          row[projectName] = normalizedValue * weight;
        });
        return row;
      });
    }
    
    // X and Y scales
    const x = d3
      .scaleBand()
      .domain(classData.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.2);
    
    let y;
    if (mcdaMethod === 'cp' || mcdaMethod === 'topsis') {
      y = d3
        .scaleLinear()
        .domain([0, 1])
        .nice()
        .range([height - margin.bottom, margin.top]);
    } else {
      // Calculate actual data range
      const allValues = stackedData.flatMap(d => 
        projectNames.map(k => d[k])
      );
      const minValue = d3.min(allValues);
      const maxValue = d3.max(allValues);
      
      // Adjust range for line and radar charts to better utilize space
      if (chartType === 'line' || chartType === 'radar') {
        const range = maxValue - minValue;
        const padding = range * 0.1; // 10% padding
        y = d3
          .scaleLinear()
          .domain([Math.max(0, minValue - padding), maxValue + padding])
          .nice()
          .range([height - margin.bottom, margin.top]);
      } else {
        // Bar chart keeps original range
        y = d3
          .scaleLinear()
          .domain([0, d3.max(stackedData, d => projectNames.reduce((sum, k) => sum + d[k], 0)) * 1.1])
          .nice()
          .range([height - margin.bottom, margin.top]);
      }
    }
    
    // Color scale
    const color = d3.scaleOrdinal()
      .domain(projectNames)
      .range(d3.schemeCategory10.concat(d3.schemeSet2));
    
    // Draw chart based on chartType
    if (chartType === 'bar') {
      // Stacked Bar Chart
      const stackGen = d3.stack().keys(projectNames);
      const series = stackGen(stackedData);
      
      svg
        .selectAll("g.stacked-bar")
        .data(series)
        .join("g")
        .attr("class", "stacked-bar")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.class))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());
        
    } else if (chartType === 'line') {
      // Multi-line Chart
      projectNames.forEach((projectName, index) => {
        const lineData = classData.map(classItem => ({
          class: classItem.name,
          value: stackedData.find(d => d.class === classItem.name)[projectName]
        }));
        
        const line = d3.line()
          .x(d => x(d.class) + x.bandwidth() / 2)
          .y(d => y(d.value));
          
        svg.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", color(projectName))
          .attr("stroke-width", 3)
          .attr("d", line);
          
        // Draw points
        svg.selectAll(`circle.${projectName.replace(/\s+/g, '')}`)
          .data(lineData)
          .join("circle")
          .attr("class", projectName.replace(/\s+/g, ''))
          .attr("cx", d => x(d.class) + x.bandwidth() / 2)
          .attr("cy", d => y(d.value))
          .attr("r", 4)
          .attr("fill", color(projectName));
      });
      
    } else if (chartType === 'radar') {
      // Radar Chart (simplified version for stacked data)
      const radarRadius = Math.min(width, height) / 2 - 60;
      const centerX = width / 2;
      const centerY = height / 2 + 20;
      const angleSlice = (2 * Math.PI) / classData.length;
      
      // Calculate radar chart data range
      const allRadarValues = stackedData.flatMap(d => 
        projectNames.map(k => d[k])
      );
      const minRadarValue = d3.min(allRadarValues);
      const maxRadarValue = d3.max(allRadarValues);
      const radarRange = maxRadarValue - minRadarValue;
      
      // Draw grid
      const levels = 5;
      for (let level = 1; level <= levels; level++) {
        const r = (radarRadius / levels) * level;
        const points = [];
        for (let i = 0; i < classData.length; i++) {
          const angle = i * angleSlice;
          points.push([
            centerX + r * Math.sin(angle),
            centerY - r * Math.cos(angle)
          ]);
        }
        svg.append("polygon")
          .attr("points", points.map(p => p.join(",")).join(" "))
          .attr("stroke", "#bbb")
          .attr("stroke-width", 1)
          .attr("fill", "none");
      }
      
      // 添加数值标签到网格
      // Add value labels to grid
      for (let level = 1; level <= levels; level++) {
        const r = (radarRadius / levels) * level;
        const value = minRadarValue + (radarRange / levels) * level;
        svg.append("text")
          .attr("x", centerX + (r + 15) * Math.sin(0))
          .attr("y", centerY - (r + 15) * Math.cos(0))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#666")
          .text(value.toFixed(1));
      }
      
      // Draw axes
      classData.forEach((classItem, i) => {
        const angle = i * angleSlice;
        svg.append("line")
          .attr("x1", centerX)
          .attr("y1", centerY)
          .attr("x2", centerX + radarRadius * Math.sin(angle))
          .attr("y2", centerY - radarRadius * Math.cos(angle))
          .attr("stroke", "#888");
          
        // Axis labels
        svg.append("text")
          .attr("x", centerX + (radarRadius + 18) * Math.sin(angle))
          .attr("y", centerY - (radarRadius + 18) * Math.cos(angle))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 12)
          .text(classItem.name);
      });
      
      // Draw data for each project
      projectNames.forEach((projectName, projectIndex) => {
        const radarPoints = classData.map((classItem, i) => {
          const value = stackedData.find(d => d.class === classItem.name)[projectName];
          // Use actual data range for normalization, not relative to maximum
          const normalizedValue = radarRange > 0 ? 
            ((value - minRadarValue) / radarRange) * radarRadius : 
            radarRadius * 0.5; // If all values are the same, place in center
          const angle = i * angleSlice;
          return [
            centerX + normalizedValue * Math.sin(angle),
            centerY - normalizedValue * Math.cos(angle)
          ];
        });
        
        svg.append("polygon")
          .attr("points", radarPoints.map(p => p.join(",")).join(" "))
          .attr("fill", color(projectName))
          .attr("fill-opacity", 0.3)
          .attr("stroke", color(projectName))
          .attr("stroke-width", 2);
          
        // Draw data points
        radarPoints.forEach(([x, y]) => {
          svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 3)
            .attr("fill", color(projectName));
        });
      });
    }
    
    // X axis (for bar and line charts)
    if (chartType === 'bar' || chartType === 'line') {
      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", d => d.length > 12 ? "10px" : "12px")
        .attr("transform", "rotate(-60)")
        .style("text-anchor", "end");
    }
    
    // Y axis (for bar and line charts)
    if (chartType === 'bar' || chartType === 'line') {
      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(mcdaMethod === 'cp' || mcdaMethod === 'topsis' ? d3.format(".2f") : d3.format(".0f")))
        .selectAll("text")
        .style("font-size", "10px");
    }

    // Add Y-axis label (for bar and line charts)
    if (chartType === 'bar' || chartType === 'line') {
      let yLabel = '';
      if (mcdaMethod === 'weighted_sum') {
        yLabel = 'Σ(value × weight)';
      } else if (mcdaMethod === 'cp') {
        yLabel = 'Σ(weight × |(value-0)/(100-0) - 1|^p)';
      } else if (mcdaMethod === 'topsis') {
        yLabel = 'Relative Closeness to Ideal';
      }
      svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
        .attr("y", 18)
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text(yLabel);
    }
    
    // Legend
    const legendContainer = d3.select("#stacked-bar-legend");
    legendContainer.selectAll("*").remove();
    
    // Horizontal flex layout with auto-wrap
    legendContainer.style("display", "flex")
      .style("flex-direction", "row")
      .style("flex-wrap", "wrap")
      .style("align-items", "center")
      .style("gap", "16px")
      .style("width", "100%");
    
    projectNames.forEach((projectName, index) => {
      const legendItem = legendContainer.append("div")
        .attr("class", "flex items-center mb-2 mr-4");
      legendItem.append("span")
        .style("display", "inline-block")
        .style("width", "18px")
        .style("height", "18px")
        .style("background-color", color(projectName))
        .style("margin-right", "8px")
        .style("border-radius", "4px");
      legendItem.append("span")
        .style("font-size", "14px")
        .text(projectName);
    });
    
    // Add Pareto dominance information to stacked chart
    const dominanceInfo = calculateParetoDominance(classData);
    const paretoOptimalClasses = dominanceInfo.filter(info => info.isParetoOptimal).map(info => info.className);
    
    if (paretoOptimalClasses.length > 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#22c55e")
        .attr("font-weight", "bold")
        .text(`⭐ Pareto Optimal: ${paretoOptimalClasses.join(", ")}`);
    }
  }, [classData, projectNames, weights, mcdaMethod, chartType]);

  // Class-wise Chart Effect (Bar/Line/Radar)
  useEffect(() => {
    if (classData.length === 0 || projectNames.length === 0) return;
    classData.forEach(classItem => {
      const svgId = `chart-${classItem.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, '')}`;
      const svg = d3.select(`#${svgId}`);
      svg.selectAll("*").remove();
      const width = 450;
      const height = 300;
      const margin = { top: 30, right: 50, bottom: 150, left: 50 };
      svg.attr("width", width).attr("height", height);
      const currentClassChartData = projectNames.map(projectName => ({
        name: projectName,
        value: classItem.projectValues[projectName] !== undefined ? classItem.projectValues[projectName] : 0,
      }));
      
      // Adjust value range for line and radar charts
      let yMin, yMax;
      if (chartType === 'line' || chartType === 'radar') {
        const minValue = d3.min(currentClassChartData, d => d.value);
        const maxValue = d3.max(currentClassChartData, d => d.value);
        const range = maxValue - minValue;
        const padding = range * 0.1; // 10% padding
        yMin = Math.min(0, minValue - padding);
        yMax = maxValue + padding;
      } else {
        // Bar chart keeps original range
        yMin = Math.min(0, d3.min(currentClassChartData, d => d.value));
        yMax = d3.max(currentClassChartData, d => d.value) * 1.1;
      }
      const x = d3
        .scaleBand()
        .domain(currentClassChartData.map((d) => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.1);
      const y = d3
        .scaleLinear()
        .domain([yMin, yMax])
        .nice()
        .range([height - margin.bottom, margin.top]);
      // Draw chart by type
      if (chartType === 'bar') {
        // Bar chart
        svg
          .selectAll("rect")
          .data(currentClassChartData)
          .join("rect")
          .attr("x", (d) => x(d.name))
          .attr("y", (d) => d.value >= 0 ? y(d.value) : y(0))
          .attr("height", (d) => Math.abs(y(d.value) - y(0)))
          .attr("width", x.bandwidth())
          .attr("fill", "#4f46e5")
          .attr("class", "transition duration-300");
        // X axis
        svg
          .append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("font-size", d => d.length > 12 ? "10px" : "12px")
          .attr("transform", "rotate(-60)")
          .style("text-anchor", "end");
        // Y axis
        svg
          .append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).tickFormat(d3.format(".0f")))
          .selectAll("text")
          .style("font-size", "10px");
      } else if (chartType === 'line') {
        // Line chart
        const line = d3.line()
          .x(d => x(d.name) + x.bandwidth() / 2)
          .y(d => y(d.value));
        svg.append("path")
          .datum(currentClassChartData)
          .attr("fill", "none")
          .attr("stroke", "#4f46e5")
          .attr("stroke-width", 3)
          .attr("d", line);
        // Draw points
        svg.selectAll("circle")
          .data(currentClassChartData)
          .join("circle")
          .attr("cx", d => x(d.name) + x.bandwidth() / 2)
          .attr("cy", d => y(d.value))
          .attr("r", 5)
          .attr("fill", "#4f46e5");
        // X axis
        svg
          .append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("font-size", d => d.length > 12 ? "10px" : "12px")
          .attr("transform", "rotate(-60)")
          .style("text-anchor", "end");
        // Y axis
        svg
          .append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).tickFormat(d3.format(".0f")))
          .selectAll("text")
          .style("font-size", "10px");
      } else if (chartType === 'radar') {
        // Radar chart implementation
        // Radar chart parameters
        const radarRadius = Math.min(width, height) / 2 - 60;
        const centerX = width / 2;
        const centerY = height / 2 + 20;
        const angleSlice = (2 * Math.PI) / currentClassChartData.length;
        const maxValue = yMax > 0 ? yMax : 1;
        // Draw grid
        const levels = 5;
        for (let level = 1; level <= levels; level++) {
          const r = (radarRadius / levels) * level;
          const points = [];
          for (let i = 0; i < currentClassChartData.length; i++) {
            const angle = i * angleSlice;
            points.push([
              centerX + r * Math.sin(angle),
              centerY - r * Math.cos(angle)
            ]);
          }
          svg.append("polygon")
            .attr("points", points.map(p => p.join(",")).join(" "))
            .attr("stroke", "#bbb")
            .attr("stroke-width", 1)
            .attr("fill", "none");
        }
        // Draw axes
        currentClassChartData.forEach((d, i) => {
          const angle = i * angleSlice;
          svg.append("line")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", centerX + radarRadius * Math.sin(angle))
            .attr("y2", centerY - radarRadius * Math.cos(angle))
            .attr("stroke", "#888");
          // Axis labels
          svg.append("text")
            .attr("x", centerX + (radarRadius + 18) * Math.sin(angle))
            .attr("y", centerY - (radarRadius + 18) * Math.cos(angle))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", 12)
            .text(d.name);
        });
        // Draw data area
        const radarPoints = currentClassChartData.map((d, i) => {
          const value = d.value / maxValue * radarRadius;
          const angle = i * angleSlice;
          return [
            centerX + value * Math.sin(angle),
            centerY - value * Math.cos(angle)
          ];
        });
        svg.append("polygon")
          .attr("points", radarPoints.map(p => p.join(",")).join(" "))
          .attr("fill", "#4f46e5")
          .attr("fill-opacity", 0.4)
          .attr("stroke", "#4f46e5")
          .attr("stroke-width", 2);
        // Draw data points
        radarPoints.forEach(([x, y]) => {
          svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", "#4f46e5");
        });
      }
      
      // Add Pareto dominance information
      const dominanceInfo = calculateParetoDominance(classData);
      const currentClassInfo = dominanceInfo.find(info => info.className === classItem.name);
      
      if (currentClassInfo) {
        // Add dominance information above chart
        const infoText = [];
        if (currentClassInfo.isParetoOptimal) {
          infoText.push("⭐ Pareto Optimal");
        }
        if (currentClassInfo.dominates.length > 0) {
          infoText.push(`Dominates: ${currentClassInfo.dominates.join(", ")}`);
        }
        if (currentClassInfo.dominatedBy.length > 0) {
          infoText.push(`Dominated by: ${currentClassInfo.dominatedBy.join(", ")}`);
        }
        
        if (infoText.length > 0) {
          svg.append("text")
            .attr("x", width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", currentClassInfo.isParetoOptimal ? "#22c55e" : "#6b7280")
            .attr("font-weight", "bold")
            .text(infoText.join(" | "));
        }
      }
        });
  }, [classData, projectNames, chartType]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full h-full">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            MCDA Interactive Data Visualization
          </h1>
        </div>
      
        {/* Main Layout - Left Panel (Controls) and Right Panel (Charts) */}
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-64px)] w-full">
          {/* Left Panel - Controls */}
          <div className="lg:w-1/2 space-y-6 overflow-y-auto">
            {/* File Selector */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <label htmlFor="fileSelect" className="block text-lg font-semibold text-gray-800">
                  Select Excel File
                </label>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Refresh Files
                </button>
              </div>
              <select
                id="fileSelect"
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700 transition-all duration-200"
                disabled={availableFiles.length === 0}
              >
                {availableFiles.length === 0 ? (
                  <option value="">Loading files...</option>
                ) : (
                  availableFiles.map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))
                )}
              </select>
              {availableFiles.length === 0 && (
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  Scanning Excel files in data folder...
                </p>
              )}
              {availableFiles.length > 0 && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  Found {availableFiles.length} Excel file{availableFiles.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* MCDA Method Selection */}
            {projectNames.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    MCDA Method Selection
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Method Selection */}
                  <div className="space-y-4">
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Choose MCDA Method:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        mcdaMethod === 'weighted_sum' 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`} onClick={() => setMcdaMethod('weighted_sum')}>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800 mb-2">Weighted Sum</div>
                          <div className="text-sm text-gray-600">Simple weighted average method</div>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        mcdaMethod === 'cp' 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`} onClick={() => setMcdaMethod('cp')}>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800 mb-2">CP (Compromise Programming)</div>
                          <div className="text-sm text-gray-600">Distance-based compromise method</div>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        mcdaMethod === 'topsis' 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`} onClick={() => setMcdaMethod('topsis')}>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800 mb-2">TOPSIS</div>
                          <div className="text-sm text-gray-600">Technique for Order Preference</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CP Parameters */}
                  {mcdaMethod === 'cp' && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CP Parameter (p):
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={cpP}
                          onChange={(e) => setCpP(parseInt(e.target.value))}
                          className="flex-1 accent-blue-600"
                        />
                        <span className="text-sm font-medium text-blue-600 w-12 text-center">
                          p = {cpP}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Higher p values give more weight to larger deviations from ideal solutions.
                      </p>
                    </div>
                  )}

                  {/* TOPSIS Parameters */}
                  {mcdaMethod === 'topsis' && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        TOPSIS Ideal Type:
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="benefit"
                            checked={topsisIdealType === 'benefit'}
                            onChange={(e) => setTopsisIdealType(e.target.value)}
                            className="mr-2 text-green-600"
                          />
                          <span className="text-sm">Benefit Criteria (Higher is better)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="cost"
                            checked={topsisIdealType === 'cost'}
                            onChange={(e) => setTopsisIdealType(e.target.value)}
                            className="mr-2 text-green-600"
                          />
                          <span className="text-sm">Cost Criteria (Lower is better)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Method Description */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Method Description:</h4>
                    {mcdaMethod === 'weighted_sum' && (
                      <p className="text-sm text-gray-600">
                        <strong>Weighted Sum:</strong> Simple linear combination of criteria values weighted by their importance. 
                        Higher scores indicate better alternatives.
                      </p>
                    )}
                    {mcdaMethod === 'cp' && (
                      <p className="text-sm text-gray-600">
                        <strong>Compromise Programming (CP):</strong> Minimizes the distance to the ideal solution (100) while 
                        maximizing the distance to the negative ideal solution (0). Lower scores indicate better alternatives.
                      </p>
                    )}
                    {mcdaMethod === 'topsis' && (
                      <p className="text-sm text-gray-600">
                        <strong>TOPSIS:</strong> Technique for Order Preference by Similarity to an Ideal Solution. 
                        Ranks alternatives based on their relative closeness to the ideal (100) and negative ideal (0) solutions. 
                        Higher scores indicate better alternatives.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Data Table */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center">
                Interactive Data Table
                </h3>
                  <button
                    className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-300 text-sm font-medium shadow-sm"
                    onClick={handleReset}
                  >
                    Reset All to Initial
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table-auto w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-left font-semibold text-gray-700">Class Name</th>
                      {projectNames.map(projectName => (
                        <th key={projectName} className="p-4 text-center font-semibold text-gray-700">
                          <div className="text-center">
                            <div className="font-bold">{projectName}</div>
                            <div className="text-xs text-indigo-600 font-medium">Weight: {((weights[projectName] || 0) * 100).toFixed(1)}%</div>
                          </div>
                        </th>
                      ))}
                      <th className="p-4 text-center font-semibold text-gray-700 sticky right-0 bg-white z-10 border-l border-gray-200">
                        {mcdaMethod === 'weighted_sum' ? 'Weighted Sum Rank' : 
                         mcdaMethod === 'cp' ? 'CP Rank' : 
                         mcdaMethod === 'topsis' ? 'TOPSIS Rank' : 'Calculated Rank'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classData.length === 0 ? (
                      <tr>
                        <td colSpan={2 + projectNames.length} className="p-6 text-center text-gray-500 font-medium">
                          <span className="animate-pulse">Loading data...</span>
                        </td>
                      </tr>
                    ) : (
                      classData.map((classItem, index) => (
                        <tr key={classItem.name} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="p-4 font-medium text-gray-800">{classItem.name}</td>
                          {projectNames.map((projectName) => (
                            <td key={`${classItem.name}-${projectName}`} className="p-4">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min={sliderMinMap[projectName] !== undefined ? sliderMinMap[projectName] : 0}
                                    max={sliderMaxMap[projectName] !== undefined ? sliderMaxMap[projectName] : 100}
                                    step="0.1"
                                    value={inputValues[`${classItem.name}-${projectName}`] !== undefined ? inputValues[`${classItem.name}-${projectName}`] : ''}
                                    onChange={e => handleInputChange(classItem.name, projectName, e.target.value)}
                                    onBlur={() => handleInputBlur(classItem.name, projectName)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleInputBlur(classItem.name, projectName); }}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLock(classItem.name, projectName)}
                                    className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                    title={lockedValues[`${classItem.name}-${projectName}`] ? 'Unlock' : 'Lock'}
                                    style={{ fontSize: '18px', lineHeight: 1 }}
                                  >
                                    {lockedValues[`${classItem.name}-${projectName}`] ? '🔒' : '🔓'}
                                  </button>
                                </div>
                                <input
                                  type="range"
                                  min={sliderMinMap[projectName] !== undefined ? sliderMinMap[projectName] : 0}
                                  max={sliderMaxMap[projectName] !== undefined ? sliderMaxMap[projectName] : 100}
                                  step="0.1"
                                  value={classItem.projectValues[projectName] !== undefined ? classItem.projectValues[projectName] : 0}
                                  onChange={(e) => handleSliderChange(classItem.name, projectName, e.target.value)}
                                  onMouseUp={() => handleSliderChangeEnd(classItem.name, projectName)}
                                  onTouchEnd={() => handleSliderChangeEnd(classItem.name, projectName)}
                                  className="w-full accent-indigo-600"
                                />
                              </div>
                            </td>
                          ))}
                          <td className="p-4 text-center sticky right-0 bg-white z-10 border-l border-gray-200">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full font-bold text-sm">
                              {classItem.currentRank}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pareto Dominance Information */}
            {projectNames.length > 0 && classData.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    Pareto Dominance Analysis
                  </h3>
                </div>
                <div className="p-6">
                  {(() => {
                    const dominanceInfo = calculateParetoDominance(classData);
                    const paretoOptimal = dominanceInfo.filter(info => info.isParetoOptimal);
                    const dominated = dominanceInfo.filter(info => !info.isParetoOptimal);
                    
                    return (
                      <div className="space-y-4">
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <h4 className="font-semibold text-emerald-800 mb-2">⭐ Pareto Optimal Solutions</h4>
                          {paretoOptimal.length > 0 ? (
                            <div className="space-y-2">
                              {paretoOptimal.map(info => (
                                <div key={info.className} className="flex items-center justify-between bg-white rounded p-2">
                                  <span className="font-medium text-gray-800">{info.className}</span>
                                  {info.dominates.length > 0 && (
                                    <span className="text-sm text-emerald-600">
                                      Dominates: {info.dominates.join(", ")}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600">No Pareto optimal solutions found.</p>
                          )}
                        </div>
                        
                        {dominated.length > 0 && (
                          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                            <h4 className="font-semibold text-amber-800 mb-2">Dominated Solutions</h4>
                            <div className="space-y-2">
                              {dominated.map(info => (
                                <div key={info.className} className="flex items-center justify-between bg-white rounded p-2">
                                  <span className="font-medium text-gray-800">{info.className}</span>
                                  <span className="text-sm text-amber-600">
                                    Dominated by: {info.dominatedBy.join(", ")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">About Pareto Dominance</h4>
                          <p className="text-sm text-blue-700">
                            A solution is Pareto optimal if no other solution dominates it. 
                            Solution A dominates Solution B if A is at least as good as B in all criteria 
                            and strictly better in at least one criterion.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Weight Control Panel */}
            {projectNames.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center">
                    Weight Settings
                    </h3>
                    <button
                      className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-300 text-sm font-medium shadow-sm"
                      onClick={handleResetWeights}
                    >
                    Reset Weights
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectNames.map(projectName => (
                      <div key={`weight-${projectName}`} className="flex flex-col bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">
                            {projectName}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleToggleWeightLock(projectName)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                            title={lockedWeights[projectName] ? 'Unlock Weight' : 'Lock Weight'}
                            style={{ fontSize: '16px', lineHeight: 1 }}
                          >
                            {lockedWeights[projectName] ? '🔒' : '🔓'}
                          </button>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={weightInputValues[projectName] !== undefined ? weightInputValues[projectName] : '0'}
                            onChange={(e) => handleWeightInputChange(projectName, e.target.value)}
                            onBlur={() => handleWeightInputBlur(projectName)}
                            onKeyDown={e => { if (e.key === 'Enter') handleWeightInputBlur(projectName); }}
                            disabled={lockedWeights[projectName]}
                            className={`w-20 px-3 py-2 border rounded-lg text-center text-sm font-medium ${
                              lockedWeights[projectName] 
                                ? 'bg-gray-200 cursor-not-allowed text-gray-500' 
                                : 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                          />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={weights[projectName] || 0}
                            onChange={(e) => handleWeightSliderChange(projectName, e.target.value)}
                            disabled={lockedWeights[projectName]}
                            className={`flex-1 accent-indigo-600 ${
                              lockedWeights[projectName] ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                          />
                          <span className="text-sm font-medium text-indigo-600 w-14 text-right">
                            {((weights[projectName] || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">Total Weight: </span>
                      <span className="ml-2 text-lg font-bold text-indigo-600">
                        {Object.values(weights).reduce((sum, weight) => sum + (weight || 0), 0).toFixed(3)}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({(Object.values(weights).reduce((sum, weight) => sum + (weight || 0), 0) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Charts */}
          <div className="lg:w-1/2 space-y-6 overflow-y-auto">
            {/* Charts Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-bold text-white flex items-center">
                  Class-wise Project Values Visualizations
                </h2>
                <div className="mt-2 md:mt-0 flex items-center">
                  <label htmlFor="chartTypeSelect" className="text-white font-medium mr-2">Chart Type:</label>
                  <select
                    id="chartTypeSelect"
                    value={chartType}
                    onChange={e => setChartType(e.target.value)}
                    className="px-3 py-1 rounded-md border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="radar">Radar Chart</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {classData.map(classItem => (
                    <div key={`chart-container-${classItem.name}`} className="bg-gray-50 rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-bold mb-4 text-center text-gray-800 flex items-center justify-center">
                        {classItem.name}
                      </h3>
                      <div className="flex justify-center">
                        <svg id={`chart-${classItem.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, '')}`} className="class-chart"></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stacked Bar Chart Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  {mcdaMethod === 'weighted_sum' ? 'Weighted Sum' : 
                   mcdaMethod === 'cp' ? 'CP (Compromise Programming)' : 
                   mcdaMethod === 'topsis' ? 'TOPSIS' : 'Weighted'} {chartType === 'bar' ? 'Stacked Bar' : 
                   chartType === 'line' ? 'Multi-Line' : 
                   chartType === 'radar' ? 'Radar' : 'Chart'} (All Classes)
                </h2>
              </div>
              <div className="p-6 flex flex-col items-start">
                <div id="stacked-bar-legend" className="flex flex-row flex-wrap items-center mb-4 w-full"></div>
                <svg id="stacked-bar-chart" width="700" height="400"></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));