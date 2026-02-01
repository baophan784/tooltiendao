import React, {
  useState,
  useEffect,
  useMemo,
  useCallback
} from 'react';

import { db } from './firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

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
  Divider,
  Pagination
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
  const [dialogType, setDialogType] = useState('');
  const [xuAmount, setXuAmount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  /* ===== PAGINATION ===== */
  const [page, setPage] = useState(1);
  const rowsPerPage = 9;

  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'lstUsers'));

      const data = snap.docs.map(d => {
        const v = d.data();
        return {
          id: d.id,
          ...v,
          timestamp: v.timestamp?.toDate?.() || new Date()
        };
      });

      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setUsers(data);
    } catch (err) {
      showSnackbar('Lỗi tải danh sách: ' + err.message, 'error');
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('isAuthenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchUsers();
  }, [isAuthenticated, fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogin = () => {
    if (username === 'admin2025' && password === 'admin2025') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      showSnackbar('Đăng nhập thành công');
    } else {
      showSnackbar('Sai tài khoản hoặc mật khẩu', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.sdt && u.sdt.includes(searchTerm))
    );
  }, [users, searchTerm]);

  const pageCount = Math.ceil(filteredUsers.length / rowsPerPage);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page]);

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
  };

  const handleXuUpdate = async () => {
    const value = parseInt(xuAmount);
    if (isNaN(value)) return;

    const ref = doc(db, 'lstUsers', selectedUser.id);
    const newXu = Math.max(0, (selectedUser.xu || 0) + value);

    await updateDoc(ref, { xu: newXu });

    setUsers(prev =>
      prev.map(u => (u.id === selectedUser.id ? { ...u, xu: newXu } : u))
    );

    showSnackbar('Cập nhật xu thành công');
    closeDialog();
  };

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      showSnackbar('Mật khẩu tối thiểu 6 ký tự', 'error');
      return;
    }

    await updateDoc(doc(db, 'lstUsers', selectedUser.id), {
      pass: newPassword
    });

    showSnackbar('Đã đặt lại mật khẩu');
    closeDialog();
  };

  const handleDelete = async user => {
    if (!window.confirm(`Xóa ${user.username}?`)) return;
    await deleteDoc(doc(db, 'lstUsers', user.id));
    setUsers(prev => prev.filter(u => u.id !== user.id));
    showSnackbar('Đã xóa người dùng');
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ width: 380 }}>
          <CardContent>
            <Typography variant="h4" textAlign="center">Admin Panel</Typography>
            <TextField fullWidth label="Username" margin="normal" onChange={e => setUsername(e.target.value)} />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              onChange={e => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <Button fullWidth variant="contained" onClick={handleLogin}>Login</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={2}>Quản lý người dùng</Typography>

      <TextField
        fullWidth
        placeholder="Tìm tên hoặc SĐT..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      <Grid container spacing={2} mt={1}>
        {paginatedUsers.map(user => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card>
              <CardContent>
                <Typography fontWeight="bold">{user.username}</Typography>
                <Typography variant="body2">Xu: {user.xu || 0}</Typography>

                <Divider sx={{ my: 1 }} />

                <Button size="small" onClick={() => openDialog(user, 'xu')} startIcon={<AddIcon />}>
                  Xu
                </Button>
                <Button size="small" onClick={() => openDialog(user, 'password')} startIcon={<LockResetIcon />}>
                  MK
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(user)} startIcon={<DeleteIcon />}>
                  Xóa
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(e, v) => setPage(v)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Dialog Xu */}
      <Dialog open={dialogOpen && dialogType === 'xu'} onClose={closeDialog}>
        <DialogTitle>Cập nhật xu</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Số xu (+ / -)"
            onChange={e => setXuAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button onClick={handleXuUpdate} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Password */}
      <Dialog open={dialogOpen && dialogType === 'password'} onClose={closeDialog}>
        <DialogTitle>Đặt lại mật khẩu</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Mật khẩu mới"
            type="password"
            onChange={e => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button onClick={handlePasswordReset} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Admin;
