import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import UrlMetrics from './components/UrlMetrics';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
  },
});

// Direct connection to backend
const API_URL = '/api';

function App() {
  const [urls, setUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [urlResults, setUrlResults] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch URLs on component mount
  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const response = await axios.get(`${API_URL}/urls`);
      setUrls(response.data);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch URLs',
        severity: 'error'
      });
    }
  };

  const handleUrlInputChange = (e) => {
    setUrlInput(e.target.value);
  };

  const addUrl = () => {
    // Split by newlines, commas, or spaces to handle multiple URLs
    const newUrls = urlInput.split(/[\n,\s]+/).filter(url => url.trim() !== '');
    
    // Basic URL validation
    const validUrls = newUrls.map(url => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    });
    
    checkUrls(validUrls);
    setUrlInput('');
  };

  const checkUrls = async (urlsToCheck) => {
    setLoading(true);
    console.log('Checking URLs:', urlsToCheck);
    
    // First, test if the API is reachable
    try {
      const healthCheck = await axios.get(`${API_URL}/health`);
      console.log('API health check:', healthCheck.data);
    } catch (error) {
      console.error('API health check failed:', error);
      setSnackbar({
        open: true,
        message: `API not reachable: ${error.message}. Check if the backend is running.`,
        severity: 'error'
      });
      setLoading(false);
      return;
    }
    
    try {
      console.log('Sending request to:', `${API_URL}/check-urls`);
      const response = await axios.post(`${API_URL}/check-urls`, {
        urls: urlsToCheck
      });
      
      console.log('Response received:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setUrlResults(response.data);
        fetchUrls(); // Refresh the URL list
        setSnackbar({
          open: true,
          message: 'URLs checked successfully',
          severity: 'success'
        });
      } else {
        console.error('Invalid response format:', response.data);
        setSnackbar({
          open: true,
          message: 'Invalid response from server',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error checking URLs:', error);
      let errorMessage = 'Failed to check URLs';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        errorMessage = `Server error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUrlSelect = (url) => {
    setSelectedUrl(url);
    setTabValue(1); // Switch to metrics tab
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            URL Health Monitor
          </Typography>
          
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Add URLs to Monitor
            </Typography>
            <TextField
              label="Enter URLs (one per line or comma-separated)"
              multiline
              rows={3}
              fullWidth
              value={urlInput}
              onChange={handleUrlInputChange}
              placeholder="https://example.com&#10;https://google.com"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={addUrl}
              disabled={loading || !urlInput.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Checking...' : 'Check URLs'}
            </Button>
          </Paper>

          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="url monitor tabs">
                <Tab label="URL Status" />
                <Tab label="Metrics & History" disabled={!selectedUrl} />
              </Tabs>
            </Box>
            
            {/* URL Status Tab */}
            <TabPanel value={tabValue} index={0}>
              {urlResults.length > 0 && (
                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Latest Results
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>URL</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="right">Response Time</TableCell>
                          <TableCell align="right">Status Code</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {urlResults.map((result, index) => (
                          <TableRow key={index} hover>
                            <TableCell component="th" scope="row">
                              {result.url}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={result.status} 
                                color={result.status === "UP" ? "success" : "error"} 
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {result.response_time ? `${result.response_time.toFixed(2)} ms` : 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              {result.status_code || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
              
              <Paper elevation={2} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Monitored URLs
                  </Typography>
                  <Button 
                    startIcon={<RefreshIcon />}
                    variant="outlined"
                    onClick={() => {
                      if (urls.length > 0) {
                        checkUrls(urls.map(url => url.url));
                      }
                    }}
                    disabled={urls.length === 0 || loading}
                  >
                    Refresh All
                  </Button>
                </Box>
                
                {urls.length === 0 ? (
                  <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 3 }}>
                    No URLs are being monitored yet. Add some URLs above to get started.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>URL</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {urls.map((url) => (
                          <TableRow key={url.id} hover>
                            <TableCell component="th" scope="row">
                              {url.url}
                            </TableCell>
                            <TableCell align="center">
                              <Button 
                                size="small" 
                                onClick={() => handleUrlSelect(url)}
                                color="primary"
                              >
                                View Metrics
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </TabPanel>
            
            {/* Metrics & History Tab */}
            <TabPanel value={tabValue} index={1}>
              {selectedUrl && <UrlMetrics url={selectedUrl} apiUrl={API_URL} />}
            </TabPanel>
          </Box>
        </Box>
        
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`url-tabpanel-${index}`}
      aria-labelledby={`url-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default App;
