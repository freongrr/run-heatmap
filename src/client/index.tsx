import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import './style.scss';

const appElement = document.getElementById('app');
ReactDOM.render(<App/>, appElement);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('run-heatmap-sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.error('SW registration failed: ', registrationError);
            });
    });
} else {
    console.error('Can\'t install service worker');
}
