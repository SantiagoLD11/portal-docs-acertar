// src/components/Layout.jsx
import React from 'react';
import logo from '../assets/images/logo.png';
import "../styles/form.css";

const Layout = ({ children }) => (
    <>
        <div className="container-log">
            <img src={logo} alt="Logo Asso" className="logo-image" />
        </div>
        <main className="main-content">{children}</main>
    </>
);

export default Layout;