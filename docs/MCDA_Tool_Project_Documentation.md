# MCDA Interactive Data Visualization Tool
## Multi-Criteria Decision Analysis Interactive Data Visualization Tool

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [User Interface Layout](#user-interface-layout)
4. [Core Function Modules](#core-function-modules)
5. [MCDA Methods Detailed](#mcda-methods-detailed)
6. [Technical Implementation](#technical-implementation)
7. [User Guide](#user-guide)
8. [File Structure](#file-structure)

---

## Project Overview

### Project Introduction
MCDA Interactive Data Visualization Tool is a web-based Multi-Criteria Decision Analysis (MCDA) interactive data visualization tool. This tool can read MCDA data in Excel format and provides real-time data adjustment, weight optimization, ranking calculation, and multiple visualization display functions.

### Main Features
- **Multi-file Support**: Automatically detects and supports multiple Excel data files
- **Real-time Interaction**: Supports slider and input box real-time adjustment of data and weights
- **Multiple MCDA Methods**: Supports three classic MCDA methods: Weighted Sum, Compromise Programming (CP), and TOPSIS
- **Data Locking**: Supports locking specific data items to prevent accidental modification
- **Multi-chart Display**: Provides three visualization methods: bar charts, line charts, and radar charts
- **Pareto Dominance Analysis**: Automatically calculates and displays Pareto optimal solutions
- **Python Script Integration**: Supports running Python scripts to generate scatter plots and tornado diagrams

---

## System Architecture

### Technology Stack
- **Frontend**: React.js, D3.js, XLSX.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Data Processing**: JavaScript, Python
- **File Format**: Excel (.xlsx, .xls)

### Architecture Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Data          │
│   Interface     │◄──►│   Service       │◄──►│   Processing    │
│   (React)       │    │   (Express)     │    │   (Python)      │
│                 │    │                 │    │                 │
│ - Data Display  │    │ - File Service  │    │ - Scatter Plot  │
│ - Interactive   │    │ - API Interface │    │   Generation    │
│   Control       │    │ - Static Assets │    │ - Tornado Chart │
│ - Chart         │    │                 │    │   Generation    │
│   Rendering     │    │                 │    │ - Data Analysis │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## User Interface Layout

### Overall Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                    MCDA Interactive Data Visualization         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Left Control  │  │         Right Chart Panel          │  │
│  │     Panel       │  │                                     │  │
│  │                 │  │                                     │  │
│  │ • File Selector │  │ • Individual Project Value Charts   │  │
│  │ • MCDA Method   │  │ • Stacked Bar/Line/Radar Charts    │  │
│  │   Selection     │  │ • Analysis Image Display            │  │
│  │ • Interactive   │  │                                     │  │
│  │   Data Table    │  │                                     │  │
│  │ • Weight Control│  │                                     │  │
│  │   Panel         │  │                                     │  │
│  │ • Pareto        │  │                                     │  │
│  │   Analysis      │  │                                     │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Layout Description

#### 1. Top Title Bar
- Project Title: MCDA Interactive Data Visualization
- Gradient background design, highlighting project professionalism

#### 2. Left Control Panel (50% width)
**File Selector Module**
- File dropdown selection box
- Refresh file button
- File status display

**MCDA Method Selection Module**
- Three method card-style selection
- Method parameter configuration
- Method description

**Interactive Data Table Module**
- Dynamic data table
- Slider and input box controls
- Data locking functionality
- Real-time ranking display

**Weight Control Panel**
- Weight slider and input box
- Weight locking functionality
- Total weight display
- Weight reset functionality

**Pareto Dominance Analysis Module**
- Pareto optimal solution display
- Dominance relationship analysis
- Advantage explanation

#### 3. Right Chart Panel (50% width)
**Project Value Visualization Module**
- Individual project charts
- Three chart type switching
- Pareto dominance information display

**Comprehensive Analysis Chart Module**
- Stacked bar/line/radar charts
- Legend display
- Method-specific labels

**Analysis Image Module**
- Scatter plot display
- Tornado chart display
- Image zoom functionality

---

## Core Function Modules

### 1. File Management Module
**Function Description**: Automatically detects and loads Excel data files
**Core Features**:
- Automatically scans Excel files in the data folder
- Supports .xlsx and .xls formats
- File selection dropdown (no suffix display)
- File refresh functionality

**Data Reading Logic**:
```javascript
// Excel file structure reading
- Row A3: Column names (indicator names)
- Rows 4 to second-to-last: Data rows (indicator values for each solution)
- Last row: Weight row (weights for each indicator)
- Last column: Initial ranking
```

### 2. Data Interaction Module
**Function Description**: Provides real-time data adjustment and weight optimization functionality
**Core Features**:
- Slider control (0-100 range)
- Numerical input box
- Data locking functionality
- Real-time ranking updates

**Interaction Logic**:
```javascript
// Data adjustment process
1. User adjusts slider or inputs value
2. System validates numerical range (0-100)
3. Updates corresponding data item
4. Recalculates ranking
5. Updates chart display
```

### 3. Weight Management Module
**Function Description**: Provides weight adjustment and optimization functionality
**Core Features**:
- Weight slider control (0-1 range)
- Weight input box
- Weight locking functionality
- Total weight constraint (sum equals 1)
- Automatic weight distribution

**Weight Constraint Logic**:
```javascript
// Weight adjustment algorithm
1. Check locked weight sum
2. Calculate remaining available weight
3. Proportionally distribute unlocked weights
4. Ensure total weight equals 1
5. Update display and calculations
```

### 4. Chart Visualization Module
**Function Description**: Provides multiple data visualization methods
**Chart Types**:
- **Bar Chart**: Suitable for discrete data comparison
- **Line Chart**: Suitable for trends and continuity
- **Radar Chart**: Suitable for multi-dimensional data display

**Chart Features**:
- Responsive design
- Interactive legend
- Dynamic data updates
- Method-specific labels

### 5. Pareto Dominance Analysis Module
**Function Description**: Automatically calculates and displays Pareto optimal solutions
**Analysis Logic**:
```javascript
// Pareto dominance judgment
For solutions A and B:
- If A is no worse than B in all indicators, and strictly better in at least one indicator
- Then A dominates B
- Pareto optimal solution: solution not dominated by any other solution
```

---

## MCDA Methods Detailed

### 1. Weighted Sum Method

#### Mathematical Principle
The Weighted Sum Method is the most classic multi-criteria decision analysis method, calculating comprehensive scores through linear combination of indicator values.

**Mathematical Formula**:
```
S_i = Σ(w_j × x_ij)
```
Where:
- S_i: Comprehensive score of solution i
- w_j: Weight of indicator j
- x_ij: Value of solution i on indicator j

#### Implementation Logic
```javascript
const calculateWeightedScore = (projectValues, weights) => {
  let totalScore = 0;
  Object.keys(projectValues).forEach(projectName => {
    const weight = weights[projectName] || 0;
    const value = projectValues[projectName] || 0;
    totalScore += value * weight;
  });
  return totalScore;
};
```

#### Characteristics
- **Advantages**: Simple and intuitive, high computational efficiency
- **Disadvantages**: Assumes linear relationships between indicators, may ignore indicator interactions
- **Applicable Scenarios**: Relatively independent indicators, decision makers prefer simple methods

### 2. Compromise Programming (CP)

#### Mathematical Principle
Compromise Programming is based on distance concepts, evaluating solutions by minimizing distance to ideal solution and maximizing distance to negative ideal solution.

**Mathematical Formula**:
```
CP_i = D_i^+ / (D_i^+ + D_i^-)
```
Where:
- D_i^+: Distance from solution i to ideal solution
- D_i^-: Distance from solution i to negative ideal solution
- p: Distance metric parameter (usually p=2, Euclidean distance)

**Distance Calculation**:
```
D_i^+ = [Σ(w_j × |x_ij - x_j^+|^p)]^(1/p)
D_i^- = [Σ(w_j × |x_ij - x_j^-|^p)]^(1/p)
```

#### Implementation Logic
```javascript
const calculateCPScore = (projectValues, weights, data, p = 2) => {
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
  
  // CP score (lower is better)
  const cpScore = distanceToIdeal / (distanceToIdeal + distanceToNegativeIdeal);
  return cpScore;
};
```

#### Characteristics
- **Advantages**: Considers ideal and negative ideal solutions, more robust results
- **Disadvantages**: Sensitive to choice of ideal and negative ideal solutions
- **Applicable Scenarios**: Decision makers focus on proximity to ideal solution

### 3. TOPSIS Method (Technique for Order Preference by Similarity to an Ideal Solution)

#### Mathematical Principle
TOPSIS method ranks solutions by calculating relative closeness to ideal and negative ideal solutions.

**Mathematical Formula**:
```
C_i = D_i^- / (D_i^+ + D_i^-)
```
Where:
- C_i: Relative closeness of solution i
- D_i^+: Distance from solution i to ideal solution
- D_i^-: Distance from solution i to negative ideal solution

**Calculation Steps**:
1. Build decision matrix
2. Normalize decision matrix
3. Calculate weighted normalized matrix
4. Determine ideal and negative ideal solutions
5. Calculate distances
6. Calculate relative closeness

#### Implementation Logic
```javascript
const calculateTopsScore = (projectValues, weights, data, idealType = 'benefit') => {
  // Build decision matrix
  const decisionMatrix = data.map(item => 
    projectNames.map(projectName => item.projectValues[projectName] || 0)
  );
  
  // Normalize decision matrix (relative to fixed ideal point 100)
  const normalizedMatrix = decisionMatrix.map(row => {
    return row.map(val => val / 100);
  });
  
  // Calculate weighted normalized matrix
  const weightedMatrix = normalizedMatrix.map(row => 
    row.map((val, index) => val * (weights[projectNames[index]] || 0))
  );
  
  // Determine ideal and negative ideal solutions
  const idealSolution = [];
  const negativeIdealSolution = [];
  
  for (let j = 0; j < projectNames.length; j++) {
    if (idealType === 'benefit') {
      idealSolution[j] = weights[projectNames[j]] || 0;
      negativeIdealSolution[j] = 0;
    } else {
      idealSolution[j] = 0;
      negativeIdealSolution[j] = weights[projectNames[j]] || 0;
    }
  }
  
  // Calculate distances
  const currentIndex = data.findIndex(item => 
    Object.keys(item.projectValues).every(key => 
      item.projectValues[key] === projectValues[key]
    )
  );
  
  if (currentIndex === -1) return 0;
  
  const currentRow = weightedMatrix[currentIndex];
  
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
```

#### Characteristics
- **Advantages**: Considers both ideal and negative ideal solutions, more comprehensive results
- **Disadvantages**: Relatively complex calculations, sensitive to data normalization methods
- **Applicable Scenarios**: Need to comprehensively consider optimal and worst-case decisions

### 4. Method Comparison

| Method | Computational Complexity | Result Stability | Applicable Scenarios | Main Features |
|--------|-------------------------|------------------|---------------------|---------------|
| Weighted Sum | Low | Medium | Simple decisions | Intuitive and easy, simple calculation |
| CP Method | Medium | High | Robust decisions | Considers ideal solution distance |
| TOPSIS | High | High | Complex decisions | Comprehensive consideration of optimal and worst cases |

---

## Technical Implementation

### 1. Frontend Technology Stack

#### React.js
- **State Management**: Uses React Hooks to manage complex state
- **Component Design**: Modular component structure
- **Responsive Updates**: Real-time data updates and interface refresh

#### D3.js
- **Chart Rendering**: Dynamically generates various chart types
- **Interactive Features**: Mouse hover, click, and other interactions
- **Data Binding**: Data-driven chart updates

#### XLSX.js
- **File Parsing**: Parses Excel file formats
- **Data Extraction**: Extracts table data
- **Format Support**: Supports .xlsx and .xls formats

### 2. Backend Technology Stack

#### Node.js + Express.js
- **Static File Service**: Provides frontend resources
- **API Interface**: Provides data interfaces
- **File Management**: Manages Excel files and image files

#### Python Integration
- **Script Execution**: Runs Python data analysis scripts
- **Image Generation**: Generates scatter plots and tornado charts
- **Data Processing**: Complex data analysis tasks

### 3. Data Flow Design

```
Excel File → Frontend Parsing → Data Storage → User Interaction → Method Calculation → Result Display
    ↓              ↓               ↓              ↓               ↓               ↓
File Selection  XLSX Parsing   React State   Slider/Input   MCDA Algorithm  Chart Rendering
```

---

## User Guide

### 1. Environment Preparation
- Install Node.js (version 14.0 or higher)
- Install Python (for script execution)
- Prepare Excel data files

### 2. Application Startup
```bash
# Install dependencies
npm install

# Start server
npm start

# Access application
http://localhost:3001
```

### 3. Data Preparation
Excel file format requirements:
- Row A3: Column names (indicator names)
- Rows 4 to second-to-last: Data rows (indicator values for each solution)
- Last row: Weight row (weights for each indicator)
- Last column: Initial ranking

### 4. Operation Process
1. **Select Data File**: Choose Excel file to analyze from dropdown
2. **Select MCDA Method**: Choose appropriate decision analysis method
3. **Adjust Parameters**: Adjust relevant parameters based on method characteristics
4. **Interactive Adjustment**: Use sliders and input boxes to adjust data and weights
5. **View Results**: Observe ranking changes and chart updates
6. **Analysis Images**: View generated scatter plots and tornado charts

---

## File Structure

```
MCDA-Tool-1.0/
├── index.html              # Main page file
├── app.js                  # Frontend application logic (2265 lines)
├── server.js               # Express server (201 lines)
├── package.json            # Project configuration and dependencies
├── README.txt              # Project documentation
├── data/                   # Excel data file directory
│   ├── MCDA ELT V7_Econ_G_Top1.xlsx
│   ├── MCDA ELT V7_Econ_L_Top1.xlsx
│   └── ...
├── image/                  # Generated image files
│   ├── scatter_plots/      # Scatter plots
│   └── tornado_diagrams/   # Tornado charts
├── src/                    # Python scripts
│   ├── Scatter.py          # Scatter plot generation script
│   ├── Tornado.py          # Tornado chart generation script
│   └── PercentageChang.py  # Percentage change script
├── static/                 # Static resources
│   └── index.html          # Backup main page file
└── node_modules/           # Node.js dependency packages
```

---

## Summary

MCDA Interactive Data Visualization Tool is a comprehensive multi-criteria decision analysis tool with the following advantages:

### Technical Advantages
- **Modern Technology Stack**: Uses React, D3.js and other modern web technologies
- **Modular Design**: Clear code structure and componentized design
- **Strong Extensibility**: Easy to add new MCDA methods and features

### Functional Advantages
- **Multiple MCDA Methods**: Supports three classic decision analysis methods
- **Real-time Interaction**: Provides intuitive data adjustment interface
- **Rich Visualization**: Multiple chart types and display methods
- **Intelligent Analysis**: Automatic Pareto dominance analysis

### Application Value
- **Decision Support**: Provides scientific basis for complex multi-criteria decisions
- **Teaching Tool**: Suitable for MCDA method teaching and demonstration
- **Research Platform**: Provides experimental platform for related research

This tool provides a modern, user-friendly, and powerful solution for multi-criteria decision analysis, effectively supporting various complex decision scenarios. 