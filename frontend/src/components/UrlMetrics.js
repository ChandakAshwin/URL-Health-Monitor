import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
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
  Card,
  CardContent,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const UrlMetrics = ({ url, apiUrl }) => {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // Default to 7 days

  useEffect(() => {
    fetchData();
  }, [url.id, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch metrics
      const metricsResponse = await axios.get(`${apiUrl}/url/${url.id}/metrics?days=${timeRange}`);
      setMetrics(metricsResponse.data);
      
      // Fetch history
      const historyResponse = await axios.get(`${apiUrl}/url/${url.id}/health-history`);
      setHistory(historyResponse.data);
    } catch (error) {
      console.error('Error fetching URL data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Prepare data for the uptime pie chart
  const uptimeChartData = {
    labels: ['Uptime', 'Downtime'],
    datasets: [
      {
        data: metrics ? [metrics.uptime_percentage, 100 - metrics.uptime_percentage] : [0, 0],
        backgroundColor: ['#4caf50', '#f44336'],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for the response time history chart
  const responseTimeData = {
    labels: history.slice(0, 20).map(check => {
      const date = new Date(check.checked_at);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }).reverse(),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: history.slice(0, 20).map(check => check.response_time).reverse(),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        tension: 0.3,
      },
    ],
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Metrics for {url.url}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value={1}>Last 24 Hours</MenuItem>
              <MenuItem value={7}>Last 7 Days</MenuItem>
              <MenuItem value={30}>Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            sx={{ ml: 2 }}
            onClick={fetchData}
          >
            Refresh Data
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uptime Percentage
                </Typography>
                <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {metrics && (
                    <Pie data={uptimeChartData} options={{ maintainAspectRatio: false }} />
                  )}
                </Box>
                <Typography variant="h4" align="center" sx={{ mt: 2 }}>
                  {metrics ? `${metrics.uptime_percentage.toFixed(2)}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Time Statistics
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Average Response Time: <strong>{metrics ? `${metrics.average_response_time.toFixed(2)} ms` : 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Total Checks: <strong>{metrics ? metrics.total_checks : 0}</strong>
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ height: 200 }}>
                  {history.length > 0 && (
                    <Line 
                      data={responseTimeData} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Response Time (ms)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Time'
                            }
                          }
                        }
                      }} 
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Health Check History
        </Typography>
        
        {history.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 3 }}>
            No health check history available for this URL.
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Response Time</TableCell>
                  <TableCell align="right">Status Code</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((check) => (
                  <TableRow key={check.id} hover>
                    <TableCell>
                      {new Date(check.checked_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={check.status ? "UP" : "DOWN"} 
                        color={check.status ? "success" : "error"} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {check.response_time ? `${check.response_time.toFixed(2)} ms` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      {check.status_code || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default UrlMetrics;
