# Excel Data Visualization Tool

An interactive Excel data visualization tool that supports dynamic value adjustment and real-time ranking calculations. This tool can read Multi-Criteria Decision Analysis (MCDA) data from Excel files and provides interactive data adjustment and visualization capabilities.

## Features

- **Dynamic Data Reading**: Automatically reads all Excel files in the `data` folder.
- **Interactive Adjustment**: Supports real-time value adjustment using sliders and input boxes.
- **Real-time Calculation**: Weighted sum ranking calculation with real-time updates.
- **Data Visualization**: Displays data changes and ranking results through charts.
- **Value Locking**: Allows locking specific values to prevent accidental changes.
- **Range Limitation**: Restricts value adjustments to the range of 0–100.
- **Multi-file Support**: Supports MCDA data files in V6 and V7 versions.

## System Requirements

### Required Software
- **Node.js** (version 14.0 or higher)
  - Download: [https://nodejs.org/](https://nodejs.org/)
  - Verify installation with: `node --version`
- **npm** (typically installed with Node.js)
  - Verify installation with: `npm --version`

### Recommended Software
- **Modern Browser**: Chrome, Firefox, Safari, Edge
- **Code Editor**: VS Code, Sublime Text, etc.

## Installation Steps

### 1. Clone or Download the Project
```bash
# If using Git
git clone [repository URL]
cd MCDA-Tool-1.0

# Or download the project files directly to your local machine
```

### 2. Install Project Dependencies
In the project root directory, run:
```bash
npm install
```

This will install the following dependencies:
- `express` (^4.18.2) - Web server framework
- `nodemon` (^3.0.1) - Auto-restart tool for development mode

### 3. Verify Installation
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if dependencies are installed correctly
npm list
```

## Running the Application

### Start in Production Mode
```bash
npm start
```

### Start in Development Mode (Recommended)
```bash
npm run dev
```
Development mode automatically restarts the server when code changes are detected.

### Access the Application
Once started, open in your browser:
```
http://localhost:3000
```

## Usage Instructions

### 1. Prepare Excel Files
Place Excel files in the `data` folder. File format requirements:
- **Row A3**: Column names (indicator names)
- **Rows 4 to second-to-last**: Data rows (indicator values for each solution)
- **Last row**: Weight row (weights for each indicator)
- **Last column**: Initial ranking

### 2. Select Data File
- The page automatically detects and lists all available Excel files.
- Select the file to analyze from the dropdown menu.
- The system will automatically load the data and display the initial state.

### 3. Interactive Data Adjustment
- **Slider Adjustment**: Use sliders to adjust the weights of each indicator.
- **Value Input**: Directly input specific values in the input boxes.
- **Value Locking**: Click the lock button to prevent specific values from being modified.
- **Real-time Updates**: All adjustments are reflected in charts and rankings in real-time.

### 4. View Results
- **Ranking Changes**: Observe ranking changes for each solution after adjustments.
- **Chart Visualization**: View data distribution intuitively through charts.
- **Weight Impact**: Analyze the impact of different weight settings on results.

## File Structure

```
MCDA-Tool-1.0/
├── index.html                    # Main page file
├── app.js                       # Frontend application logic (1953 lines)
├── server.js                    # Express server (34 lines)
├── package.json                 # Project configuration and dependencies
├── README.md                    # Project documentation
├── data/                        # Directory for Excel data files
```

### Core File Description
- **index.html**: Main page of the application, containing HTML structure and basic styles.
- **app.js**: Frontend JavaScript logic, handling data processing, chart rendering, and interactive features.
- **server.js**: Express server providing static file services and API endpoints.
- **package.json**: Project configuration defining dependencies and run scripts.

## Technology Stack
- **Frontend**: Native JavaScript, D3.js, XLSX.js
- **Backend**: Node.js, Express.js
- **Styling**: Tailwind CSS

## Development Instructions

### Modifying Code
- Frontend logic is in `app.js`.
- Server configuration is in `server.js`.
- Styles can be adjusted by modifying Tailwind classes in `index.html`.

### Adding New Features
1. Modify `app.js` to implement new features.
2. Update `server.js` to add new API endpoints if needed.
3. Update `index.html` to include new UI elements.