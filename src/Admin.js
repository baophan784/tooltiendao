import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from './firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  InputAdornment,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  LockReset as LockResetIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { useDebounce } from 'use-debounce';

function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm] = useDebounce(searchInput, 300);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'xu', 'password'
  const [xuAmount, setXuAmount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchUsers = useCallback(async () => {
    try {
      // Query đơn giản không orderBy để tránh lỗi
      const querySnapshot = await getDocs(collection(db, 'lstUsers'));
      console.log('Query result:', querySnapshot.docs.length, 'documents');
      
      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        return { 
          id: doc.id, 
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date()
        };
      });
      
      // Sắp xếp theo timestamp giảm dần (mới nhất lên đầu)
      usersData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log('Processed users:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Lỗi tải danh sách người dùng: ' + error.message, 'error');
    }
  }, []);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, fetchUsers]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLogin = () => {
    if (username === 'admin2025' && password === 'admin2025') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      showSnackbar('Đăng nhập thành công!', 'success');
    } else {
      showSnackbar('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    showSnackbar('Đã đăng xuất!', 'info');
  };

  const openDialog = (user, type) => {
    setSelectedUser(user);
    setDialogType(type);
    setDialogOpen(true);
    setXuAmount('');
    setNewPassword('');
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setDialogType('');
    setXuAmount('');
    setNewPassword('');
  };

  const handleXuUpdate = async () => {
    if (!xuAmount || isNaN(xuAmount) || xuAmount <= 0) {
      showSnackbar('Vui lòng nhập số xu hợp lệ!', 'error');
      return;
    }

    try {
      const userDoc = doc(db, 'lstUsers', selectedUser.id);
      const currentXu = selectedUser.xu || 0;
      const newXu = Math.max(0, currentXu + parseInt(xuAmount));
      
      await updateDoc(userDoc, { xu: newXu });
      
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id ? { ...user, xu: newXu } : user
        )
      );
      
      showSnackbar(`Đã ${parseInt(xuAmount) > 0 ? 'thêm' : 'trừ'} ${Math.abs(parseInt(xuAmount))} xu cho ${selectedUser.username}!`, 'success');
      closeDialog();
    } catch (error) {
      console.error('Error updating xu:', error);
      showSnackbar('Lỗi cập nhật xu!', 'error');
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      showSnackbar('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
      return;
    }

    try {
      const userDoc = doc(db, 'lstUsers', selectedUser.id);
      await updateDoc(userDoc, { pass: newPassword });
      
      showSnackbar(`Đã đặt lại mật khẩu cho ${selectedUser.username}!`, 'success');
      closeDialog();
    } catch (error) {
      console.error('Error resetting password:', error);
      showSnackbar('Lỗi đặt lại mật khẩu!', 'error');
    }
  };

  const handleDelete = async (user) => {
    const confirmDelete = window.confirm(`Bạn có chắc muốn xóa người dùng ${user.username}?`);
    if (!confirmDelete) return;

    try {
      const userDoc = doc(db, 'lstUsers', user.id);
      await deleteDoc(userDoc);
      
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      showSnackbar(`Đã xóa người dùng ${user.username}!`, 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('Lỗi xóa người dùng!', 'error');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.sdt && user.sdt.includes(searchTerm))
    );
  }, [users, searchTerm]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isNewUser = (timestamp) => {
    if (!timestamp) return false;
    const now = new Date();
    const userDate = new Date(timestamp);
    const diffHours = (now - userDate) / (1000 * 60 * 60);
    return diffHours < 24; // Mới trong 24 giờ
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}>
        <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Admin Panel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đăng nhập để quản lý hệ thống
              </Typography>
            </Box>
            
            <TextField
              label="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockResetIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              fullWidth
              size="large"
              sx={{ mt: 3, py: 1.5 }}
            >
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Quản lý người dùng
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng số người dùng: {users.length}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="info" 
                onClick={fetchUsers}
                size="small"
              >
                Refresh
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleLogout}
                startIcon={<DeleteIcon />}
              >
                Đăng xuất
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Search */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <TextField
            label="Tìm kiếm người dùng"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Nhập tên hoặc số điện thoại..."
          />
        </CardContent>
      </Card>

      {/* Users List */}
      <Grid container spacing={2}>
        {filteredUsers.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card sx={{ 
              boxShadow: 2, 
              transition: 'all 0.3s',
              '&:hover': { 
                boxShadow: 4,
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {user.username}
                  </Typography>
                  {isNewUser(user.timestamp) && (
                    <Box
                      sx={{
                        ml: 1,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#4caf50',
                        color: 'white',
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                    >
                      MỚI
                    </Box>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, fontSize: 16, color: '#666' }} />
                    <Typography variant="body2" color="text.secondary">
                      {user.sdt || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WalletIcon sx={{ mr: 1, fontSize: 16, color: '#666' }} />
                    <Typography variant="body2" color="text.secondary">
                      Xu: <strong style={{ color: '#d32f2f' }}>{user.xu || 0}</strong>
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => openDialog(user, 'xu')}
                    sx={{ flex: 1, minWidth: '80px' }}
                  >
                    Thêm xu
                  </Button>
                  
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    startIcon={<RemoveIcon />}
                    onClick={() => openDialog(user, 'xu')}
                    sx={{ flex: 1, minWidth: '80px' }}
                  >
                    Trừ xu
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    startIcon={<LockResetIcon />}
                    onClick={() => openDialog(user, 'password')}
                    sx={{ flex: 1, minWidth: '80px' }}
                  >
                    Đặt lại MK
                  </Button>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(user)}
                    sx={{ flex: 1, minWidth: '80px' }}
                  >
                    Xóa
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Tạo: {formatDate(user.timestamp)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredUsers.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              Không tìm thấy người dùng nào
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Dialog for Xu Management */}
      <Dialog open={dialogOpen && dialogType === 'xu'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {xuAmount && parseInt(xuAmount) < 0 ? 'Trừ xu' : 'Thêm xu'} cho {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={xuAmount && parseInt(xuAmount) < 0 ? 'Số xu cần trừ' : 'Số xu cần thêm'}
            type="number"
            value={xuAmount}
            onChange={(e) => setXuAmount(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">Xu:</InputAdornment>,
            }}
            helperText={`Xu hiện tại: ${selectedUser?.xu || 0}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button onClick={handleXuUpdate} variant="contained">
            {xuAmount && parseInt(xuAmount) < 0 ? 'Trừ xu' : 'Thêm xu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Password Reset */}
      <Dialog open={dialogOpen && dialogType === 'password'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Đặt lại mật khẩu cho {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Mật khẩu mới"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockResetIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Mật khẩu phải có ít nhất 6 ký tự"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button onClick={handlePasswordReset} variant="contained">
            Đặt lại mật khẩu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Admin;