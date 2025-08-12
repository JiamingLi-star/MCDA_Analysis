# MCDA Multi-Criteria Decision Analysis Tool User Manual

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Requirements](#system-requirements)
3. [Quick Start](#quick-start)
4. [Feature Details](#feature-details)
5. [User Guide](#user-guide)
6. [Data Format Requirements](#data-format-requirements)
7. [Frequently Asked Questions](#frequently-asked-questions)
8. [Technical Support](#technical-support)

---

## Project Overview

### What is the MCDA Tool?
The MCDA Multi-Criteria Decision Analysis Tool is a web-based interactive data visualization tool specifically designed for Multi-Criteria Decision Analysis (MCDA). This tool can read MCDA data in Excel format and provides real-time data adjustment, weight optimization, ranking calculation, and multiple visualization display functions.

### Key Features
- **Multi-file Support**: Automatically detects and supports multiple Excel data files
- **Real-time Interaction**: Supports slider and input box real-time adjustment of data and weights
- **Multiple MCDA Methods**: Supports three classic MCDA methods: Weighted Sum, Compromise Programming (CP), and TOPSIS
- **Data Locking**: Supports locking specific data items to prevent accidental modification
- **Multi-chart Display**: Provides three visualization methods: bar charts, line charts, and radar charts
- **Pareto Dominance Analysis**: Automatically calculates and displays Pareto optimal solutions
- **Advanced Analysis Charts**: Automatically generates scatter plots and tornado diagrams for in-depth analysis

### Application Scenarios
- **Decision Support**: Provides scientific basis for complex multi-criteria decisions
- **Teaching Tool**: Suitable for MCDA method teaching and demonstration
- **Research Platform**: Provides experimental platform for related research
- **Project Evaluation**: Evaluates comprehensive performance of different project alternatives
- **Online Analysis**: Conduct data analysis anytime, anywhere through browser

---

## System Requirements

### Required Software
- **Modern Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Network Connection**: Stable internet connection

### Recommended Configuration
- **Operating System**: Windows 10/11, macOS 10.15+, Linux, Mobile devices
- **Memory**: 2GB or higher
- **Screen Resolution**: 1024x768 or higher
- **Network Speed**: At least 1Mbps download speed

### Browser Compatibility
| Browser | Minimum Version | Recommended Version | Status |
|---------|-----------------|---------------------|--------|
| Chrome | 80 | Latest | ✅ Fully Supported |
| Firefox | 75 | Latest | ✅ Fully Supported |
| Safari | 13 | Latest | ✅ Fully Supported |
| Edge | 80 | Latest | ✅ Fully Supported |
| IE | - | - | ❌ Not Supported |

---

## Quick Start

### Accessing the Application

#### Method 1: Direct Access
1. Open your web browser
2. Enter the website address in the address bar
3. Press Enter to access the application

#### Method 2: Link Access
- Click the provided link to directly enter the application
- Or scan QR code (if provided) for quick access

### First Time Use
1. **Access Website**: Open browser and visit the MCDA tool website
2. **Select Data File**: Choose Excel file to analyze from dropdown menu
3. **View Initial Data**: System will automatically load data and display initial state
4. **Start Analysis**: Use various functions for interactive data analysis

### Interface Overview
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

---

## Feature Details

### 1. File Management Module

#### Function Description
Automatically detects and loads Excel data files, supporting multiple file formats.

#### Core Features
- **Auto Scan**: Automatically scans available Excel data files
- **Format Support**: Supports .xlsx and .xls formats
- **File Selection**: Dropdown menu selection (no suffix display)
- **File Refresh**: Supports manual refresh of file list
- **Cloud Storage**: Data files stored in cloud, no local files needed

#### Data Reading Logic
```
Excel file structure reading:
- Row A3: Column names (indicator names)
- Rows 4 to second-to-last: Data rows (indicator values for each solution)
- Last row: Weight row (weights for each indicator)
- Last column: Initial ranking
```

### 2. MCDA Method Selection

#### Weighted Sum Method
- **Mathematical Principle**: Calculates comprehensive scores through linear combination of indicator values
- **Applicable Scenarios**: Relatively independent indicators, decision makers prefer simple methods
- **Characteristics**: Simple and intuitive calculation, high computational efficiency
- **Formula**: S_i = Σ(w_j × x_ij)

#### Compromise Programming (CP)
- **Mathematical Principle**: Based on distance concepts, evaluates solutions by minimizing distance to ideal solution
- **Applicable Scenarios**: Decision makers focus on proximity to ideal solution
- **Characteristics**: Considers ideal and negative ideal solutions, more robust results
- **Parameters**: Adjustable distance metric parameter p

#### TOPSIS Method
- **Mathematical Principle**: Ranks solutions by calculating relative closeness to ideal and negative ideal solutions
- **Applicable Scenarios**: Need to comprehensively consider optimal and worst-case decisions
- **Characteristics**: Comprehensive consideration of ideal and negative ideal solutions, more comprehensive results
- **Options**: Can choose benefit-type or cost-type indicators

### 3. Data Interaction Module

#### Function Description
Provides real-time data adjustment and weight optimization functionality.

#### Core Features
- **Slider Control**: 0-100 range slider control
- **Numerical Input**: Numerical input boxes
- **Data Locking**: Data locking functionality
- **Real-time Ranking Updates**: Real-time ranking updates
- **Responsive Design**: Adapts to different screen sizes

#### Interaction Logic
```
Data adjustment process:
1. User adjusts slider or inputs value
2. System validates numerical range (0-100)
3. Updates corresponding data item
4. Recalculates ranking
5. Updates chart display
```

### 4. Weight Management Module

#### Function Description
Provides weight adjustment and optimization functionality.

#### Core Features
- **Weight Sliders**: 0-1 range weight slider control
- **Weight Input**: Weight input boxes
- **Weight Locking**: Weight locking functionality
- **Total Weight Constraint**: Total weight equals 1 constraint
- **Automatic Weight Distribution**: Automatic weight distribution functionality

#### Weight Constraint Logic
```
Weight adjustment algorithm:
1. Check locked weight sum
2. Calculate remaining available weight
3. Proportionally distribute unlocked weights
4. Ensure total weight equals 1
5. Update display and calculations
```

### 5. Chart Visualization Module

#### Function Description
Provides multiple data visualization methods.

#### Chart Types
- **Bar Chart**: Suitable for discrete data comparison
- **Line Chart**: Suitable for trends and continuity
- **Radar Chart**: Suitable for multi-dimensional data display

#### Chart Features
- **Responsive Design**: Adaptive to different screen sizes
- **Interactive Legend**: Interactive legend display
- **Dynamic Data Updates**: Real-time data updates
- **Method-specific Labels**: Method-specific labels
- **Mobile Adaptation**: Supports touch operations

### 6. Pareto Dominance Analysis Module

#### Function Description
Automatically calculates and displays Pareto optimal solutions.

#### Analysis Logic
```
Pareto dominance judgment:
For solutions A and B:
- If A is no worse than B in all indicators, and strictly better in at least one indicator
- Then A dominates B
- Pareto optimal solution: solution not dominated by any other solution
```

#### Display Features
- **Dominance Identification**: Automatically identifies Pareto optimal solutions
- **Dominance Relationships**: Displays dominance relationships between solutions
- **Decision Recommendations**: Provides decision recommendations based on Pareto analysis

### 7. Advanced Analysis Charts

#### Scatter Plot Analysis
- **Function**: Generates scatter plots to display data distribution
- **Features**: Automatically identifies Pareto optimal solutions
- **Interactivity**: Supports zoom and pan
- **Export Function**: Can download as PNG format

#### Tornado Chart Analysis
- **Function**: Generates tornado charts to display sensitivity analysis
- **Features**: Shows impact degree of each indicator on results
- **Sorting Function**: Automatically sorts by impact degree
- **Export Function**: Can download as PNG format

---

## User Guide

### 1. Data Preparation

#### Excel File Format Requirements
Ensure your Excel file conforms to the following format:
- **Row A3**: Column names (indicator names)
- **Rows 4 to second-to-last**: Data rows (indicator values for each solution)
- **Last row**: Weight row (weights for each indicator)
- **Last column**: Initial ranking

#### Example Data Format
```
| Indicator Name | Solution A | Solution B | Solution C | Ranking |
|----------------|------------|------------|------------|---------|
| Cost           | 80         | 60         | 90         | 2       |
| Quality        | 85         | 90         | 75         | 1       |
| Time           | 70         | 85         | 80         | 3       |
| Weights        | 0.4        | 0.3        | 0.3        |         |
```

#### Data Requirements
- **Value Range**: All indicator values should be within 0-100 range
- **Weight Constraint**: Sum of all weights should equal 1
- **Data Integrity**: No empty values or invalid data
- **Format Consistency**: All values should be in numeric format

### 2. Basic Operation Process

#### Step 1: Select Data File
1. Open the MCDA tool website
2. Choose Excel file to analyze from dropdown menu
3. System will automatically load data and display initial state

#### Step 2: Select MCDA Method
1. Choose appropriate MCDA method in left control panel
2. Adjust relevant parameters based on method characteristics
3. Observe ranking and chart changes

#### Step 3: Adjust Weights
1. Use weight sliders to adjust weights of each indicator
2. Or directly input specific values in weight input boxes
3. Use lock buttons to lock specific weights
4. Observe whether total weight equals 1

#### Step 4: Interactive Data Adjustment
1. Use data sliders to adjust indicator values of each solution
2. Or directly input specific values in data input boxes
3. Use lock buttons to lock specific data items
4. Real-time observe ranking and chart changes

#### Step 5: View Analysis Results
1. Observe display effects of different chart types
2. View Pareto dominance analysis results
3. Analyze impact of weight changes on results
4. View generated scatter plots and tornado charts

### 3. Advanced Feature Usage

#### Data Locking Function
- **Purpose**: Prevent accidental modification of important data
- **Operation**: Click lock button next to data item
- **Effect**: Locked data items cannot be modified through sliders or input boxes
- **Visual Cues**: Locked items will have obvious visual indicators

#### Weight Optimization
- **Automatic Distribution**: System automatically distributes unlocked weights
- **Constraint Checking**: Ensures total weight always equals 1
- **Reset Function**: Can reset all weights to initial state with one click
- **Real-time Validation**: Real-time validation of weight constraints during input

#### Chart Switching
- **Bar Chart**: Suitable for comparing absolute values of different solutions
- **Line Chart**: Suitable for observing trend changes
- **Radar Chart**: Suitable for comprehensive display of multi-dimensional data
- **Responsive Switching**: Charts automatically adjust based on screen size

#### Pareto Analysis
- **Dominance Identification**: Automatically identifies Pareto optimal solutions
- **Dominance Relationships**: Displays dominance relationships between solutions
- **Decision Support**: Provides scientific basis for decisions
- **Visual Display**: Highlights optimal solutions through colors and markers

### 4. Mobile Usage

#### Touch Operations
- **Slider Operations**: Use finger sliding to adjust values
- **Chart Interaction**: Supports touch zoom and pan
- **Responsive Layout**: Interface automatically adapts to mobile devices

#### Mobile Optimization
- **Touch-friendly**: Buttons and controls suitable for finger operation
- **Simplified Interface**: Displays simplified interface on mobile
- **Quick Access**: Prioritizes display of commonly used functions

---

## Data Format Requirements

### Excel File Structure

#### Standard Format
```
Row A3: Indicator names (column headers)
Rows 4 to second-to-last: Indicator values for each solution
Last row: Weight values
Last column: Initial ranking
```

#### Data Requirements
- **Value Range**: All indicator values should be within 0-100 range
- **Weight Constraint**: Sum of all weights should equal 1
- **Data Integrity**: No empty values or invalid data
- **Format Consistency**: All values should be in numeric format
- **File Size**: Recommended single file not exceeding 10MB

### Supported File Formats
- **Excel 2007+**: .xlsx format (recommended)
- **Excel 97-2003**: .xls format
- **CSV Files**: .csv format (partially supported)

### Data Validation
- **Automatic Validation**: System automatically validates data format
- **Error Messages**: Displays specific error messages for format errors
- **Data Repair Suggestions**: Provides specific suggestions for data repair

---

## Frequently Asked Questions

### 1. Cannot Access Website

#### Problem Description
Browser cannot open the MCDA tool website.

#### Solutions
1. **Check Network Connection**
   - Ensure network connection is normal
   - Try accessing other websites to confirm network status

2. **Check Browser**
   - Use recommended browsers (Chrome, Firefox, Safari, Edge)
   - Ensure browser version meets requirements
   - Clear browser cache and cookies

3. **Check URL**
   - Confirm the entered URL is correct
   - Check for spelling errors

4. **Try Other Methods**
   - Use different browsers
   - Try incognito/private mode
   - Use mobile device to access

### 2. Data File Cannot Load

#### Problem Description
Excel file cannot load correctly or displays errors.

#### Solutions
1. **Check File Format**
   - Ensure file is in .xlsx or .xls format
   - Check if file is corrupted
   - Try resaving the file

2. **Check Data Format**
   - Ensure data conforms to standard format requirements
   - Check for empty values or invalid data
   - Verify that sum of weights equals 1

3. **Check File Size**
   - Ensure file size does not exceed 10MB
   - If file is too large, consider splitting data

4. **Refresh Page**
   - Press F5 to refresh browser page
   - Reselect file

### 3. Weight Adjustment Issues

#### Problem Description
Weights cannot be adjusted or total weight does not equal 1.

#### Solutions
1. **Check Lock Status**
   - Ensure weights to be adjusted are not locked
   - Unlock relevant weights before adjusting

2. **Reset Weights**
   - Use reset button to restore initial weights
   - Re-adjust weights

3. **Check Value Range**
   - Ensure weight values are within 0-1 range
   - Check input format is correct

4. **Manual Calculation**
   - Manually calculate sum of weights
   - Ensure sum equals 1

### 4. Chart Display Issues

#### Problem Description
Charts cannot display normally or display abnormally.

#### Solutions
1. **Refresh Page**
   - Press F5 to refresh browser page
   - Clear browser cache

2. **Check Browser Compatibility**
   - Use Chrome, Firefox, Safari, or Edge
   - Ensure browser version is recent

3. **Check Data Integrity**
   - Ensure data has no empty values or invalid values
   - Check data range is reasonable

4. **Adjust Display Settings**
   - Try different chart types
   - Adjust browser zoom ratio

### 5. Performance Issues

#### Problem Description
Application runs slowly or has response delays.

#### Solutions
1. **Close Other Programs**
   - Close unnecessary browser tabs
   - Close other resource-consuming programs

2. **Clear Cache**
   - Clear browser cache and cookies
   - Restart browser

3. **Check Network**
   - Ensure network connection is stable
   - Try using wired network connection

4. **Use Recommended Browser**
   - Use latest version of Chrome or Firefox
   - Avoid using IE browser

### 6. Mobile Issues

#### Problem Description
Poor user experience on mobile devices.

#### Solutions
1. **Use Mobile Optimization**
   - Use mobile-specific interface
   - Enable touch optimization features

2. **Adjust Display**
   - Adjust screen orientation (landscape/portrait)
   - Adjust browser zoom

3. **Use Recommended Devices**
   - Use devices with larger screen sizes
   - Ensure device performance is sufficient

---

## Technical Support

### Getting Help
If you encounter problems during use, you can get help through the following methods:

1. **View Documentation**
   - Carefully read this user manual
   - View help documentation on the website

2. **FAQ**
   - Refer to the FAQ section in this manual
   - View FAQ page on the website

3. **Online Support**
   - Get support through contact methods provided on the website
   - Submit problem feedback

### Contact Support
For further technical support, please provide the following information:
- Operating system version
- Browser type and version
- Error message screenshots
- Detailed problem description
- Reproduction steps

### Feedback and Suggestions
- Submit suggestions through website feedback function
- Report discovered bugs or problems
- Propose feature improvement suggestions

---

## Appendix

### Keyboard Shortcuts
- **F5**: Refresh page
- **Ctrl+R**: Refresh page
- **Ctrl+F5**: Force refresh (clear cache)
- **Ctrl+Z**: Undo operation (if supported)
- **Ctrl+Y**: Redo operation (if supported)

### Browser Settings Recommendations
- **Enable JavaScript**: Ensure browser enables JavaScript
- **Allow Pop-ups**: Allow website to display necessary pop-ups
- **Enable Cookies**: Allow website to use cookies to save settings

### Best Practices
- **Regular Saving**: Regularly save important analysis results
- **Data Backup**: Backup important Excel data files
- **Stable Network**: Ensure network connection is stable
- **Browser Updates**: Keep browser updated to latest version

### Privacy and Security
- **Data Security**: Uploaded data is only used for analysis and will not be permanently stored
- **Privacy Protection**: Will not collect personal identity information
- **Secure Transmission**: Uses HTTPS encryption for data transmission

---

**Version Information**: MCDA-Tool-Web-1.0  
**Last Updated**: 2024  
**Document Version**: 1.0  
**Applicable Environment**: Web Browser
