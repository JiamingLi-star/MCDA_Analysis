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
  
  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Script execution state
  const [isRunningScripts, setIsRunningScripts] = useState(false);
  const [scriptStatus, setScriptStatus] = useState('');
  
  // MCDA method selection
  const [mcdaMethod, setMcdaMethod] = useState('weighted_sum'); // 'weighted_sum' | 'cp' | 'topsis'
  
  // Track if data has been modified
  const [isDataModified, setIsDataModified] = useState(false);


  // Check if image files exist and run Python scripts if needed
  const checkAndGenerateImages = async () => {
    try {
      // Check if image folder is empty
      const imageResponse = await fetch('/api/check-images');
      
      if (!imageResponse.ok) {
        console.error('Failed to check image folder');
        return;
      }
      
      const imageResult = await imageResponse.json();
      
      // If image folder is empty, run the Python scripts
      if (!imageResult.hasFiles) {
        console.log('Image folder is empty, running Python scripts...');
        setIsRunningScripts(true);
        setScriptStatus('Checking image folder...');
        
        // Run Scatter.py
        setScriptStatus('Running Scatter.py...');
        try {
          const scatterResponse = await fetch('/api/run-script?script=Scatter.py');
          if (scatterResponse.ok) {
            const result = await scatterResponse.json();
            if (result.success) {
              console.log('Scatter.py executed successfully');
              setScriptStatus('Scatter.py completed successfully');
            } else {
              console.error('Failed to execute Scatter.py:', result.message);
              setScriptStatus('Scatter.py failed');
            }
          } else {
            console.error('Failed to execute Scatter.py');
            setScriptStatus('Scatter.py failed');
          }
        } catch (error) {
          console.error('Error running Scatter.py:', error);
          setScriptStatus('Scatter.py error');
        }
        
        // Run Tornado.py
        setScriptStatus('Running Tornado.py...');
        try {
          const tornadoResponse = await fetch('/api/run-script?script=Tornado.py');
          if (tornadoResponse.ok) {
            const result = await tornadoResponse.json();
            if (result.success) {
              console.log('Tornado.py executed successfully');
              setScriptStatus('Tornado.py completed successfully');
            } else {
              console.error('Failed to execute Tornado.py:', result.message);
              setScriptStatus('Tornado.py failed');
            }
          } else {
            console.error('Failed to execute Tornado.py');
            setScriptStatus('Tornado.py failed');
          }
        } catch (error) {
          console.error('Error running Tornado.py:', error);
          setScriptStatus('Tornado.py error');
        }
        
        // Clear status after a delay
        setTimeout(() => {
          setIsRunningScripts(false);
          setScriptStatus('');
        }, 3000);
      } else {
        console.log('Image folder is not empty, skipping Python script execution');
      }
    } catch (error) {
      console.error('Error checking image folder:', error);
      setIsRunningScripts(false);
      setScriptStatus('Error checking folder');
    }
  };

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
    
    const initializeApp = async () => {
      await fetchFileList();
      await checkAndGenerateImages();
    };
    
    initializeApp();
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
  const calculateCPScore = (projectValues, weights, data) => {
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
      
      distanceToIdeal += weight * Math.pow(Math.abs(normalizedValue - normalizedIdeal), 2);
      distanceToNegativeIdeal += weight * Math.pow(Math.abs(normalizedValue - normalizedNegativeIdeal), 2);
    });
    
    // Calculate CP score (lower is better)
    const cpScore = distanceToIdeal / (distanceToIdeal + distanceToNegativeIdeal);
    return cpScore;
  };

  // TOPSIS method calculation
  const calculateTopsScore = (projectValues, weights, data) => {
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
      idealSolution[j] = weights[projectNames[j]] || 0; // Ideal point normalized to 1, multiplied by weight
      negativeIdealSolution[j] = 0; // Negative ideal point normalized to 0
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
        score: calculateCPScore(classItem.projectValues, weights, data)
      }));
    } else if (mcdaMethod === 'topsis') {
      // TOPSIS method
      scores = data.map(classItem => ({
        name: classItem.name,
        score: calculateTopsScore(classItem.projectValues, weights, data)
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

    // Clear image display when file changes
    const imageContainer = document.getElementById('analysis-image-container');
    const imageTypeSelect = document.getElementById('imageTypeSelect');
    if (imageContainer) {
      imageContainer.innerHTML = `
        <div class="text-center text-gray-500">
          <p class="text-lg font-medium">Loading scatter plots...</p>
          <p class="text-sm mt-2">Images are generated from the selected Excel file</p>
          <p class="text-xs mt-1 text-gray-400">Run Scatter.py and Tornado.py to generate images</p>
        </div>
      `;
    }
    if (imageTypeSelect) {
      imageTypeSelect.value = 'scatter';
    }

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
        
        // Read weights (find row where first cell is 'Criteria Weight')
        const weightsRowIndex = rawDataSheet1.findIndex(row => row[0] === 'Criteria Weight');
        if (weightsRowIndex === -1) {
          console.warn("No 'Criteria Weight' row found in the sheet.");
          return;
        }
        const weightsRow = rawDataSheet1[weightsRowIndex];
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

        // Extract class names (from row 4 to the row above weights row)
        const dataRows = rawDataSheet1.slice(3, weightsRowIndex); // Row 4 to the row above weights row
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
        
        // Reset data modification status when loading new file
        setIsDataModified(false);

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

      // Calculate Y-axis min and max values, only positive values for Class-wise charts
      const allValues = currentClassChartData.map(d => d.value);
      const yMin = 0; // Always start from 0 for Class-wise charts
      const yMax = d3.max(allValues);
      
      // Handle cases where all values are very small or zero
      let finalYMin = yMin;
      let finalYMax = yMax;
      
      if (yMax === 0) {
        // All values are zero, set a small positive range
        finalYMin = 0;
        finalYMax = 0.1;
      } else if (yMax < 0.01) {
        // Very small values, expand range for better visibility
        finalYMin = 0;
        finalYMax = Math.max(0.01, yMax * 10);
      } else {
        // Normal case, add 10% padding above max value
        finalYMin = 0;
        finalYMax = yMax * 1.1;
      }

    const x = d3
      .scaleBand()
        .domain(currentClassChartData.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
        .domain([finalYMin, finalYMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

      svg.selectAll("*").remove();

              // Draw bar chart
        svg
          .selectAll("rect")
          .data(currentClassChartData)
          .join("rect")
          .attr("x", (d) => x(d.name))
          .attr("y", (d) => y(Math.max(0, d.value))) // Always draw from 0 or above
          .attr("height", (d) => Math.abs(y(Math.max(0, d.value)) - y(0)))
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
        .call(d3.axisLeft(y).tickFormat(d => {
          // Use appropriate format based on value magnitude
          if (Math.abs(d) < 0.01) {
            return d3.format(".3f")(d); // 3 decimal places for very small values
          } else if (Math.abs(d) < 1) {
            return d3.format(".2f")(d); // 2 decimal places for small values
          } else {
            return d3.format(".1f")(d); // 1 decimal place for larger values
          }
        }))
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
    
    // Mark data as modified
    setIsDataModified(true);
    
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
    
    // Mark data as modified
    setIsDataModified(true);
    
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
  }, [weights, mcdaMethod]);

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
        // Mark data as modified
        setIsDataModified(true);
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
          // Mark data as modified
          setIsDataModified(true);
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
            // Mark data as modified
            setIsDataModified(true);
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
    
    // Reset data modification status
    setIsDataModified(false);
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
      
      // Calculate total values for each class
      const totalValues = stackedData.map(d => projectNames.reduce((sum, k) => sum + d[k], 0));
      const maxTotal = d3.max(totalValues);
      
      // Handle cases where all values are very small or zero
      let finalMax = maxTotal;
      if (maxTotal === 0) {
        // All values are zero, set a small range
        finalMax = 0.1;
      } else if (maxTotal < 0.01) {
        // Very small values, expand range for better visibility
        finalMax = Math.max(0.01, maxTotal * 10);
      } else {
        // Normal case, add 10% padding
        finalMax = maxTotal * 1.1;
      }
      
      // Always use bar chart range for Weighted Sum Stacked Bar
      y = d3
        .scaleLinear()
        .domain([0, finalMax])
        .nice()
        .range([height - margin.bottom, margin.top]);
    }
    
    // Color scale
    const color = d3.scaleOrdinal()
      .domain(projectNames)
      .range(d3.schemeCategory10.concat(d3.schemeSet2));
    
    // Always draw Stacked Bar Chart for Weighted Sum Stacked Bar
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
      .call(d3.axisLeft(y).tickFormat(d => {
        if (mcdaMethod === 'cp' || mcdaMethod === 'topsis') {
          return d3.format(".2f")(d);
        } else {
          // Use appropriate format based on value magnitude for weighted sum
          if (Math.abs(d) < 0.01) {
            return d3.format(".3f")(d); // 3 decimal places for very small values
          } else if (Math.abs(d) < 1) {
            return d3.format(".2f")(d); // 2 decimal places for small values
          } else {
            return d3.format(".1f")(d); // 1 decimal place for larger values
          }
        }
      }))
      .selectAll("text")
      .style("font-size", "10px");

    // Add Y-axis label
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
  }, [classData, projectNames, weights, mcdaMethod]);

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
      
      // Adjust value range for line and radar charts, only positive values for Class-wise charts
      let yMin, yMax;
      const allValues = currentClassChartData.map(d => d.value);
      const minValue = d3.min(allValues);
      const maxValue = d3.max(allValues);
      
      if (chartType === 'line' || chartType === 'radar') {
        const range = maxValue - minValue;
        if (range === 0) {
          // All values are the same
          if (maxValue === 0) {
            yMin = 0;
            yMax = 0.1;
          } else {
            yMin = 0;
            yMax = maxValue * 1.1;
          }
        } else {
          const padding = range * 0.1; // 10% padding
          yMin = 0; // Always start from 0
          yMax = maxValue + padding;
        }
      } else {
        // Bar chart with improved range calculation, only positive values
        if (maxValue === minValue) {
          // All values are the same
          if (maxValue === 0) {
            yMin = 0;
            yMax = 0.1;
          } else {
            yMin = 0;
            yMax = maxValue * 1.1;
          }
        } else {
          const range = maxValue - minValue;
          if (range < 0.01) {
            // Very small range, expand it for better visibility
            const padding = Math.max(0.01, Math.abs(maxValue) * 0.1);
            yMin = 0;
            yMax = maxValue + padding;
          } else {
            // Normal range, add 10% padding
            const padding = range * 0.1;
            yMin = 0;
            yMax = maxValue + padding;
          }
        }
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
          .call(d3.axisLeft(y).tickFormat(d => {
            // Use appropriate format based on value magnitude
            if (Math.abs(d) < 0.01) {
              return d3.format(".3f")(d); // 3 decimal places for very small values
            } else if (Math.abs(d) < 1) {
              return d3.format(".2f")(d); // 2 decimal places for small values
            } else {
              return d3.format(".1f")(d); // 1 decimal place for larger values
            }
          }))
          .selectAll("text")
          .style("font-size", "10px");
      } else if (chartType === 'line') {
        // Line chart
        const line = d3.line()
          .x(d => x(d.name) + x.bandwidth() / 2)
          .y(d => y(Math.max(0, d.value))); // Always draw at 0 or above
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
          .attr("cy", d => y(Math.max(0, d.value))) // Always draw at 0 or above
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
          .call(d3.axisLeft(y).tickFormat(d => {
            // Use appropriate format based on value magnitude
            if (Math.abs(d) < 0.01) {
              return d3.format(".3f")(d); // 3 decimal places for very small values
            } else if (Math.abs(d) < 1) {
              return d3.format(".2f")(d); // 2 decimal places for small values
            } else {
              return d3.format(".1f")(d); // 1 decimal place for larger values
            }
          }))
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
          // Axis labels - show truncated text if too many criteria
          const displayText = currentClassChartData.length > 20 ? d.name.substring(0, 3) + "..." : d.name;
          svg.append("text")
            .attr("x", centerX + (radarRadius + 18) * Math.sin(angle))
            .attr("y", centerY - (radarRadius + 18) * Math.cos(angle))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", 12)
            .style("cursor", "pointer")
            .text(displayText)
            .on("mouseover", function(event) {
              // Show tooltip for axis label
              const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "white")
                .style("padding", "8px")
                .style("border-radius", "4px")
                .style("font-size", "12px")
                .style("pointer-events", "none")
                .style("z-index", "1000");
              
              tooltip.html(`
                <strong>${d.name}</strong><br/>
                Value: ${d.value.toFixed(2)}
              `);
              
              tooltip.style("left", (event.pageX + 10) + "px")
                     .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
              // Remove tooltip
              d3.selectAll(".tooltip").remove();
            });
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
        // Draw data points with tooltip
        radarPoints.forEach(([x, y], i) => {
          const dataPoint = currentClassChartData[i];
          svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", "#4f46e5")
            .style("cursor", "pointer")
            .on("mouseover", function(event) {
              // Show tooltip
              const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "white")
                .style("padding", "8px")
                .style("border-radius", "4px")
                .style("font-size", "12px")
                .style("pointer-events", "none")
                .style("z-index", "1000");
              
              tooltip.html(`
                <strong>${dataPoint.name}</strong><br/>
                Value: ${dataPoint.value.toFixed(2)}
              `);
              
              tooltip.style("left", (event.pageX + 10) + "px")
                     .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
              // Remove tooltip
              d3.selectAll(".tooltip").remove();
            });
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

  // Auto-load scatter plots when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      const imageContainer = document.getElementById('analysis-image-container');
      const imageTypeSelect = document.getElementById('imageTypeSelect');
      
      if (imageContainer && imageTypeSelect) {
        // Trigger the onChange event to load scatter plots
        const event = new Event('change', { bubbles: true });
        imageTypeSelect.dispatchEvent(event);
      }
    }
  }, [selectedFile]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isImageModalOpen) {
        setIsImageModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageModalOpen]);

  return (
    <div className="w-full h-screen">
      <div className="w-full h-full">
        {/* Main Layout - Left Panel (Controls) and Right Panel (Charts) */}
        <div className="flex flex-col lg:flex-row gap-4 h-full w-full">
          {/* Left Panel - Controls */}
          <div className="lg:w-1/2 space-y-6 overflow-y-auto">
            {/* File Selector */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  📁 Select and load MCDA data from Excel files. The tool automatically scans the data folder for available files.
                </p>
              </div>
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
                      {file.replace(/\.(xlsx|xls)$/i, '')}
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

            {/* Script Execution Status */}
            {isRunningScripts && (
              <div className="bg-blue-50 rounded-lg shadow-md p-4 border border-blue-200">
                <div className="mb-2">
                  <p className="text-sm text-blue-700">
                    🔄 Python scripts are running to generate analysis images. This may take a few moments.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Generating Analysis Images</p>
                    <p className="text-xs text-blue-600">{scriptStatus}</p>
                  </div>
                </div>
              </div>
            )}

            {/* MCDA Method Selection */}
            {projectNames.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                  <div className="mb-2">
                    <p className="text-sm text-white opacity-90">
                      🎯 Choose from three MCDA methods: Weighted Sum, Compromise Programming (CP), or TOPSIS for multi-criteria decision analysis.
                    </p>
                  </div>
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
                <div className="mb-2">
                  <p className="text-sm text-white opacity-90">
                    📊 Interactive data table with real-time sliders and input fields. Lock/unlock values and see instant ranking updates.
                  </p>
                </div>
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

            {/* Weight Control Panel */}
            {projectNames.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="mb-2">
                    <p className="text-sm text-white opacity-90">
                      ⚖️ Adjust criteria weights using sliders or input fields. Lock weights to prevent changes and monitor total weight.
                    </p>
                  </div>
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

            {/* Pareto Dominance Information */}
            {projectNames.length > 0 && classData.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                  <div className="mb-2">
                    <p className="text-sm text-white opacity-90">
                      ⭐ Analyze Pareto optimal solutions and dominated alternatives to identify the best non-dominated options.
                    </p>
                  </div>
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
          </div>

          {/* Right Panel - Charts */}
          <div className="lg:w-1/2 space-y-6 overflow-y-auto">
            {/* Charts Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-2">
                  <p className="text-sm text-white opacity-90">
                    📈 Visualize data with bar, line, or radar charts for each class. Switch between chart types for different perspectives.
                  </p>
                </div>
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
            {mcdaMethod === 'weighted_sum' && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                  <div className="mb-2">
                    <p className="text-sm text-white opacity-90">
                      📊 Comprehensive stacked bar chart showing weighted sum results across all classes for easy comparison.
                    </p>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center">
                    {mcdaMethod === 'weighted_sum' ? 'Weighted Sum' : 
                     mcdaMethod === 'cp' ? 'CP (Compromise Programming)' : 
                     mcdaMethod === 'topsis' ? 'TOPSIS' : 'Weighted'} Stacked Bar (All Classes)
                  </h2>
                </div>
                <div className="p-6 flex flex-col items-start">
                  <div id="stacked-bar-legend" className="flex flex-row flex-wrap items-center mb-4 w-full"></div>
                  <svg id="stacked-bar-chart" width="700" height="400"></svg>
                </div>
              </div>
            )}

            {/* Analysis Images Section */}
            {mcdaMethod === 'weighted_sum' && (
              <div className={`rounded-lg shadow-lg border overflow-hidden transition-all duration-300 ${
                isDataModified 
                  ? 'bg-gray-100 border-gray-300' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`px-6 py-4 transition-all duration-300 ${
                  isDataModified 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}>
                  <div className="mb-2">
                    <p className={`text-sm opacity-90 ${
                      isDataModified ? 'text-gray-500' : 'text-white'
                    }`}>
                      🖼️ View scatter plots and tornado diagrams generated by Python scripts for advanced analysis.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <h2 className={`text-xl font-bold flex items-center ${
                      isDataModified ? 'text-gray-600' : 'text-white'
                    }`}>
                      Analysis Images
                      {isDataModified && (
                        <span className="ml-2 text-sm font-normal opacity-75">
                          (Data Modified - Not Applicable)
                        </span>
                      )}
                    </h2>
                    {!isDataModified && (
                      <div className="mt-2 md:mt-0 flex items-center space-x-4">
                        <label htmlFor="imageTypeSelect" className="text-white font-medium">Image Type:</label>
                        <select
                          id="imageTypeSelect"
                          className="px-3 py-1 rounded-md border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          defaultValue="scatter"
                          onChange={(e) => {
                            const imageType = e.target.value;
                            const imageContainer = document.getElementById('analysis-image-container');
                            if (imageContainer) {
                              imageContainer.innerHTML = '';
                              if (imageType && selectedFile) {
                                const fileName = selectedFile.replace(/\.(xlsx|xls)$/i, '');
                                
                                // Show loading state
                                imageContainer.innerHTML = `
                                  <div class="flex justify-center items-center py-8">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    <span class="ml-2 text-gray-600">Loading images...</span>
                                  </div>
                                `;
                                
                                // Define image file names based on type
                                const imageFiles = imageType === 'scatter' ? [
                                  'Criteria_Weight_Full_Order.png',
                                  'Criteria_Weight_-_Top_1.png',
                                  'Criteria_Weight_Normalised_Full_Order.png',
                                  'Criteria_Weight_Normalised_-_Top_1.png'
                                ] : [
                                  'Criteria_Weight_Full_Order.png',
                                  'Criteria_Weight_-_Top_1.png',
                                  'Criteria_Weight_Normalised_Full_Order.png',
                                  'Criteria_Weight_Normalised_-_Top_1.png'
                                ];
                                
                                // Create container for all images
                                const imagesContainer = document.createElement('div');
                                imagesContainer.className = 'space-y-6 w-full';
                                
                                let loadedImages = 0;
                                let totalImages = imageFiles.length;
                                
                                imageFiles.forEach((imageFile) => {
                                  const imagePath = `/image/${imageType === 'scatter' ? 'scatter_plots' : 'tornado_diagrams'}/${fileName}/${imageFile}`;
                                  
                                  const img = document.createElement('img');
                                  img.src = imagePath;
                                  img.alt = imageFile;
                                  img.className = 'w-full h-auto max-h-80 object-contain rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200';
                                  img.style.cursor = 'pointer';
                                  
                                  // Add click event for image enlargement
                                  img.onclick = () => {
                                    setSelectedImage({
                                      src: imagePath,
                                      title: imageFile.replace(/\.(png|jpg|jpeg)$/i, '').replace(/_/g, ' '),
                                      alt: imageFile
                                    });
                                    setIsImageModalOpen(true);
                                  };
                                  
                                  const imgContainer = document.createElement('div');
                                  imgContainer.className = 'bg-white rounded-lg shadow-md p-4 border border-gray-200';
                                  
                                  const title = document.createElement('h4');
                                  title.className = 'text-lg font-semibold text-gray-800 mb-3 text-center';
                                  title.textContent = imageFile.replace(/\.(png|jpg|jpeg)$/i, '').replace(/_/g, ' ');
                                  
                                  imgContainer.appendChild(title);
                                  imgContainer.appendChild(img);
                                  imagesContainer.appendChild(imgContainer);
                                  
                                  img.onload = () => {
                                    loadedImages++;
                                    if (loadedImages === totalImages) {
                                      imageContainer.innerHTML = '';
                                      imageContainer.appendChild(imagesContainer);
                                    }
                                  };
                                  
                                  img.onerror = () => {
                                    loadedImages++;
                                    // Replace failed image with error message
                                    imgContainer.innerHTML = `
                                      <h4 class="text-lg font-semibold text-gray-800 mb-3 text-center">${imageFile.replace(/\.(png|jpg|jpeg)$/i, '').replace(/_/g, ' ')}</h4>
                                      <div class="text-center text-gray-500 py-8">
                                        <div class="text-sm">Image not found</div>
                                        <div class="text-xs mt-1">Path: ${imagePath}</div>
                                      </div>
                                    `;
                                    
                                    if (loadedImages === totalImages) {
                                      imageContainer.innerHTML = '';
                                      imageContainer.appendChild(imagesContainer);
                                    }
                                  };
                                });
                              }
                            }
                          }}
                        >
                          <option value="scatter">Scatter Plot</option>
                          <option value="tornado">Tornado Diagram</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div id="analysis-image-container" className={`flex justify-center items-center min-h-64 rounded-lg border-2 border-dashed transition-all duration-300 ${
                    isDataModified 
                      ? 'bg-gray-100 border-gray-300' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    {isDataModified ? (
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-4">⚠️</div>
                        <p className="text-lg font-medium">Analysis Images Not Available</p>
                        <p className="text-sm mt-2">Data has been modified from the original values</p>
                        <p className="text-xs mt-1 text-gray-400">Reset data to original values to view analysis images</p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <p className="text-lg font-medium">Loading scatter plots...</p>
                        <p className="text-sm mt-2">Images are generated from the selected Excel file</p>
                        <p className="text-xs mt-1 text-gray-400">Run Scatter.py and Tornado.py to generate images</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto relative">
            {/* Close button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
            >
              ×
            </button>
            
            {/* Modal content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                {selectedImage.title}
              </h3>
              <div className="flex justify-center">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));