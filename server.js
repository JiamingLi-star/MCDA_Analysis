const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');

app.use(cors({
  origin: 'https://2hangz.github.io'
}));

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static('public'));
app.use(express.static('.'));

// Function to check if images exist
function checkImagesExist() {
  const imageDir = path.join(__dirname, 'image');
  const scatterDir = path.join(imageDir, 'scatter_plots');
  const tornadoDir = path.join(imageDir, 'tornado_diagrams');
  
  try {
    // Check if image directories exist
    if (!fs.existsSync(scatterDir) || !fs.existsSync(tornadoDir)) {
      return false;
    }
    
    // Check if there are any image files in the directories
    const scatterFiles = fs.readdirSync(scatterDir);
    const tornadoFiles = fs.readdirSync(tornadoDir);
    
    // Check if any subdirectories contain PNG files
    const hasScatterImages = scatterFiles.some(file => {
      const subDir = path.join(scatterDir, file);
      return fs.statSync(subDir).isDirectory() && 
             fs.readdirSync(subDir).some(f => f.endsWith('.png'));
    });
    
    const hasTornadoImages = tornadoFiles.some(file => {
      const subDir = path.join(tornadoDir, file);
      return fs.statSync(subDir).isDirectory() && 
             fs.readdirSync(subDir).some(f => f.endsWith('.png'));
    });
    
    return hasScatterImages || hasTornadoImages;
  } catch (error) {
    console.error('Error checking images:', error);
    return false;
  }
}

// Function to run Python scripts
function runPythonScripts() {
  console.log('No images found, running Python scripts...');
  
  const scripts = ['Scatter.py', 'Tornado.py'];
  let completedScripts = 0;
  
  scripts.forEach(scriptName => {
    const scriptPath = path.join(__dirname, scriptName);
    
    if (fs.existsSync(scriptPath)) {
      console.log(`Running ${scriptName}...`);
      
      const pythonProcess = spawn('python', [scriptPath], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      pythonProcess.stdout.on('data', (data) => {
        console.log(`${scriptName} output:`, data.toString());
      });
      
      pythonProcess.stderr.on('data', (data) => {
        console.error(`${scriptName} error:`, data.toString());
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`${scriptName} finished with code ${code}`);
        completedScripts++;
        
        if (completedScripts === scripts.length) {
          console.log('All Python scripts completed');
        }
      });
    } else {
      console.log(`${scriptName} not found`);
      completedScripts++;
    }
  });
}

// API endpoint: Check specific image type
app.get('/api/check-images', (req, res) => {
  const imageDir = path.join(__dirname, 'image');
  
  try {
    // Check if image directory exists
    if (!fs.existsSync(imageDir)) {
      return res.json({ hasFiles: false });
    }
    
    // Check if image directory is empty
    const files = fs.readdirSync(imageDir);
    const hasFiles = files.length > 0;
    
    res.json({ hasFiles });
  } catch (error) {
    console.error('Error checking images:', error);
    res.status(500).json({ error: 'Failed to check images' });
  }
});

// API endpoint: Run specific Python script
app.get('/api/run-script', (req, res) => {
  const { script } = req.query;
  
  if (!script || !['Scatter.py', 'Tornado.py'].includes(script)) {
    return res.status(400).json({ error: 'Invalid script parameter' });
  }
  
  const scriptPath = path.join(__dirname, script);
  
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: 'Script not found' });
  }
  
  console.log(`Running ${script}...`);
  
  const pythonProcess = spawn('python', [scriptPath], {
    cwd: __dirname,
    stdio: 'pipe'
  });
  
  let output = '';
  let errorOutput = '';
  
  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log(`${script} output:`, data.toString());
  });
  
  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error(`${script} error:`, data.toString());
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`${script} finished with code ${code}`);
    if (code === 0) {
      res.json({ 
        success: true, 
        message: `${script} executed successfully`,
        output: output
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: `${script} failed with code ${code}`,
        error: errorOutput
      });
    }
  });
  
  pythonProcess.on('error', (error) => {
    console.error(`Error running ${script}:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Error running ${script}`,
      error: error.message
    });
  });
});

// Default route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint: Get list of files in data folder
app.get('/api/files', (req, res) => {
  const dataDir = path.join(__dirname, 'data');
  
  try {
    if (!fs.existsSync(dataDir)) {
      return res.status(404).json({ error: 'Data directory not found' });
    }
    
    const files = fs.readdirSync(dataDir);
    const excelFiles = files.filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    );
    
    res.json(excelFiles);
  } catch (error) {
    console.error('Error reading data directory:', error);
    res.status(500).json({ error: 'Failed to read data directory' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Check images on server start
  const imagesExist = checkImagesExist();
  if (!imagesExist) {
    console.log('No images found on server start, running Python scripts...');
    runPythonScripts();
  }
}); 
