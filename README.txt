Excel Data Visualization Tool

An interactive Excel data visualization tool that supports dynamic value adjustment and real-time ranking calculations. This tool can read Multi-Criteria Decision Analysis (MCDA) data from Excel files and provides interactive data adjustment and visualization capabilities.

Features

- Dynamic Data Reading: Automatically reads all Excel files in the data folder
- Interactive Adjustment: Supports real-time value adjustment using sliders and input boxes
- Real-time Calculation: Weighted sum ranking calculation with real-time updates
- Data Visualization: Chart display of data changes and ranking results
- Value Locking: Supports locking specific values to prevent accidental changes
- Range Limitation: Value adjustment range limited to 0-100
- Multi-file Support: Supports MCDA data files of V6 and V7 versions

System Requirements

Required Software
- Node.js (version 14.0 or higher)
- Modern Browser (Chrome, Firefox, Safari, Edge)

Recommended Configuration
- Operating System: Windows 10/11, macOS 10.15+, Linux
- Memory: 4GB or higher
- Storage Space: At least 500MB available space

Software Download and Installation

Step 1: Download and Install Node.js

1. Visit Official Website
   - Open browser and visit: https://nodejs.org/

2. Select Version
   - Recommended to download LTS version (Long Term Support version)
   - Click the green "LTS" button to download

3. Install Node.js
   - Double-click the downloaded installation file
   - Follow the installation wizard prompts
   - Important: Keep default options during installation

4. Verify Installation
   - Open Command Prompt (Windows) or Terminal (Mac/Linux)
   - Enter the following commands to verify installation:
     node --version
     npm --version
   - If version numbers are displayed, installation is successful

Step 2: Download Project Files

1. Extract Project Files
   - Extract the received project archive to a local folder
   - Recommended to extract to desktop or documents folder for easy access

2. Confirm File Structure
   After extraction, the following files and folders should be included:
   MCDA-Tool-1.0/
   ├── index.html
   ├── app.js
   ├── server.js
   ├── package.json
   ├── README.txt
   ├── data/
   └── node_modules/ (auto-generated after installation)

Project File Description

Core Files
- index.html: Main page file containing user interface
- app.js: Application logic file (79KB, 1953 lines of code)
- server.js: Server file providing web services
- package.json: Project configuration file defining dependencies

Data Files
- data/: Folder containing all Excel data files

Launch Application

Method 1: Using Command Line (Recommended)

1. Open Command Prompt/Terminal
   - Windows: Press Win + R, type cmd, press Enter
   - Mac: Open "Terminal" application
   - Linux: Open terminal

2. Navigate to Project Folder
   cd path/to/MCDA-Tool-1.0
   For example:
   cd C:\Users\username\Desktop\MCDA-Tool-1.0

3. Install Project Dependencies
   npm install
   Wait for installation to complete, progress will be displayed

4. Launch Application
   npm start

5. Access Application
   - Open browser
   - Enter in address bar: http://localhost:3000
   - Press Enter

Usage Instructions

1. Prepare Excel Files
Place Excel files in the data folder. File format requirements:
- Row A3: Column names (indicator names)
- Rows 4 to second-to-last: Data rows (indicator values for each solution)
- Last row: Weight row (weights for each indicator)
- Last column: Initial ranking

Custom Data Reading Range
If you need to modify the data reading range of Excel files, you can make the following modifications in the app.js file:

Column Name Reading Range (lines 267-275):
// Currently reads column names from row A3
const columnNamesRow = rawDataSheet1[2]; // A3 row
// Modify [2] to change the row number to read (0 means row 1, 1 means row 2, etc.)

Project Name Extraction Range (line 281):
// Currently from B3 to second-to-last column
const extractedProjectNames = columnNamesRow.slice(1, -1); // B3 to second-to-last column
// Modify slice(1, -1) to change column range
// slice(0, -1) starts from column 1, slice(2, -1) starts from column 3

Weight Reading Range (lines 283-284):
// Currently reads weights from last row
const weightsRow = rawDataSheet1[rawDataSheet1.length - 1]; // Last row
// Modify index to change row number to read
// For example: rawDataSheet1[rawDataSheet1.length - 2] reads second-to-last row

Class Name Extraction Range (line 295):
// Currently from row 4 to second-to-last row
const dataRows = rawDataSheet1.slice(3, -1); // Row 4 to second-to-last row
// Modify slice(3, -1) to change data row range
// slice(2, -1) starts from row 3, slice(4, -1) starts from row 5

Weight Mapping Range (line 289):
// Currently starts from column B
const weight = parseFloat(weightsRow[index + 1]) || 0; // Starting from B column
// Modify index + 1 to change starting column
// index + 0 starts from column A, index + 2 starts from column C

Project Value Reading Range (line 310):
// Currently starts from column B
const colIndex = extractedProjectNames.indexOf(projectName) + 1;
// Modify + 1 to change starting column offset

2. Select Data File
- Page will automatically detect and list all available Excel files
- Select the file to analyze from the dropdown menu
- System will automatically load data and display initial state

3. Interactive Data Adjustment
- Slider Adjustment: Use sliders to adjust weights of each indicator
- Value Input: Directly input specific values in input boxes
- Value Locking: Click lock button to prevent specific values from being modified
- Real-time Updates: All adjustments are reflected in charts and rankings in real-time

4. View Results
- Ranking Changes: Observe ranking changes of each solution after adjustment
- Chart Visualization: Intuitively view data distribution through charts
- Weight Impact: Analyze the impact of different weight settings on results

File Structure Description

MCDA-Tool-1.0/
├── index.html                    # Main page file
├── app.js                       # Frontend application logic (1953 lines)
├── server.js                    # Express server (34 lines)
├── package.json                 # Project configuration and dependencies
├── README.txt                   # Project documentation
├── data/                        # Excel data file directory

Core File Description

- index.html: Main page of the application, containing HTML structure and basic styles
- app.js: Frontend JavaScript logic, containing data processing, chart drawing, and interactive functions
- server.js: Express server providing static file services and API interfaces
- package.json: Project configuration defining dependencies and run scripts

Technology Stack

- Frontend: Native JavaScript, D3.js, XLSX.js
- Backend: Node.js, Express.js
- Styling: Tailwind CSS

Development Instructions

Modify Code
- Frontend logic is in app.js
- Server configuration is in server.js
- Styles can be adjusted by modifying Tailwind classes in HTML

Add New Features
1. Modify app.js to add new features
2. If needed, update server.js to add new API endpoints
3. Update index.html to add new UI elements 