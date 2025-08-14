import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import ReactQuill from 'react-quill';

// Types
interface Person { id: string; name: string }

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

interface MountOptions {
  elementId?: string;
  element?: HTMLElement;
  apiBaseUrl?: string;
  getToken?: () => Promise<string> | string;
  onCreated?: (task: { id: string; title: string }) => void;
  buttonText?: string;
  themeMode?: 'light' | 'dark';
}

interface AppProps extends Required<Pick<MountOptions, 'apiBaseUrl'>> {
  getToken: () => Promise<string>;
  onCreated?: (task: { id: string; title: string }) => void;
  buttonText: string;
  themeMode: 'light' | 'dark';
}

function ensureReactQuillStylesInjected(): void {
  if (document.querySelector('link[data-react-quill="true"]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/react-quill@2.0.0/dist/quill.snow.css';
  link.setAttribute('data-react-quill', 'true');
  document.head.appendChild(link);
}

function normalizeBaseUrl(apiBaseUrl?: string): string | undefined {
  if (!apiBaseUrl) return undefined;
  return apiBaseUrl.replace(/\/$/, '');
}

function deriveApiBaseUrlFromSelf(): string | undefined {
  const scripts = Array.from(document.getElementsByTagName('script'));
  const selfScript = scripts.find(s => (s.src || '').includes('task-widget.js'));
  if (!selfScript || !selfScript.src) return undefined;
  try {
    const url = new URL(selfScript.src, window.location.href);
    return url.origin; // assumes APIs are served from same origin as the widget file
  } catch {
    return undefined;
  }
}

function useAuthorizedFetch(apiBaseUrl: string, getToken: () => Promise<string>) {
  const base = normalizeBaseUrl(apiBaseUrl)!;
  const fetchWithAuth = useCallback(async (path: string, init?: RequestInit) => {
    const token = await getToken();
    const headers = new Headers(init?.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${base}${path}`, { ...init, headers });
  }, [base, getToken]);
  return fetchWithAuth;
}

function App(props: AppProps) {
  const { apiBaseUrl, getToken, onCreated, buttonText, themeMode } = props;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [assignedToId, setAssignedToId] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchWithAuth = useAuthorizedFetch(apiBaseUrl, getToken);

  useEffect(() => { ensureReactQuillStylesInjected(); }, []);

  useEffect(() => {
    if (!open) return;
    setLoadingPeople(true);
    fetchWithAuth('/api/people')
      .then(async r => {
        if (!r.ok) throw new Error(`Failed to load people: ${r.status}`);
        const data = await r.json() as Person[];
        setPeople(data);
      })
      .catch(err => {
        setSnackbar({ open: true, message: err.message || 'Failed to load people', severity: 'error' });
      })
      .finally(() => setLoadingPeople(false));
  }, [open, fetchWithAuth]);

  const canSubmit = title.trim().length > 0 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      descriptionHtml,
      priority,
      dueDate: dueDate ? dueDate.format('YYYY-MM-DD') : null,
      assignedToId: assignedToId || null
    };
    try {
      const res = await fetchWithAuth('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Failed to create task: ${res.status}`);
      const json = await res.json();
      setSnackbar({ open: true, message: `Task created: ${json.title}`, severity: 'success' });
      setOpen(false);
      setTitle('');
      setDescriptionHtml('');
      setPriority('MEDIUM');
      setDueDate(null);
      setAssignedToId('');
      onCreated && onCreated(json);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Error creating task', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const theme = useMemo(() => createTheme({ palette: { mode: themeMode } }), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Button variant="contained" onClick={() => setOpen(true)}>{buttonText}</Button>
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Task</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              margin="normal"
            />

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <InputLabel shrink>Description</InputLabel>
              <ReactQuill theme="snow" value={descriptionHtml} onChange={setDescriptionHtml} />
            </div>

            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <MenuItem value="LOW">LOW</MenuItem>
                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                <MenuItem value="HIGH">HIGH</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <DatePicker
                label="Due date"
                value={dueDate}
                onChange={(v) => setDueDate(v)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="assigned-label">Assigned to</InputLabel>
              <Select
                labelId="assigned-label"
                label="Assigned to"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value as string)}
                disabled={loadingPeople}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {loadingPeople && (
                  <MenuItem value="__loading" disabled>
                    <CircularProgress size={18} sx={{ mr: 1 }} /> Loading...
                  </MenuItem>
                )}
                {!loadingPeople && people.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onSubmit} variant="contained" disabled={!canSubmit}>{submitting ? 'Saving...' : 'Create'}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

// Mount API
const roots = new WeakMap<HTMLElement, ReactDOM.Root>();

function toElement(options: MountOptions): HTMLElement {
  if (options.element) return options.element;
  if (options.elementId) {
    const el = document.getElementById(options.elementId);
    if (!el) throw new Error(`No element found with id ${options.elementId}`);
    return el;
  }
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function toGetToken(getToken?: MountOptions['getToken']): () => Promise<string> {
  if (getToken) {
    return async () => Promise.resolve(typeof getToken === 'function' ? await getToken() : getToken);
  }
  // Fallback to window.keycloak if present
  return async () => {
    const anyWin: any = window as any;
    if (anyWin.keycloak && typeof anyWin.keycloak.updateToken === 'function') {
      await anyWin.keycloak.updateToken(30);
      return anyWin.keycloak.token as string;
    }
    throw new Error('No getToken provided and window.keycloak not available');
  };
}

function mount(options: MountOptions = {}): { unmount: () => void } {
  const container = toElement(options);
  const existing = roots.get(container);
  if (existing) {
    return { unmount: () => unmount({ element: container }) };
  }

  ensureReactQuillStylesInjected();

  const apiBaseUrl = normalizeBaseUrl(options.apiBaseUrl) || deriveApiBaseUrlFromSelf();
  if (!apiBaseUrl) {
    throw new Error('apiBaseUrl is required (or ensure the script is served from the same origin as the API)');
  }

  const getToken = toGetToken(options.getToken);

  const root = ReactDOM.createRoot(container);
  roots.set(container, root);
  root.render(
    <App
      apiBaseUrl={apiBaseUrl}
      getToken={getToken}
      onCreated={options.onCreated}
      buttonText={options.buttonText || 'Add Task'}
      themeMode={options.themeMode || 'light'}
    />
  );

  return { unmount: () => unmount({ element: container }) };
}

function unmount(options: { elementId?: string; element?: HTMLElement } = {}): void {
  const container = toElement(options);
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
}

// Expose global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).TaskWidget = { mount, unmount };