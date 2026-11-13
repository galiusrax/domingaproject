import {createRoot} from 'react-dom/client';import App from './App.jsx';import './styles.css';import {applyTheme,loadTheme} from './theme.js';applyTheme(loadTheme());
createRoot(document.getElementById('root')).render(<App/>);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
