import React from 'react'

export default function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash__logo-container">
        <div className="splash__logo">AG</div>
      </div>
      <h1 className="splash__title">Anti-Gravity</h1>
      <p className="splash__subtitle">After Effects Plugin Library</p>
      <div className="splash__progress">
        <div className="splash__progress-bar" />
      </div>
      <p className="splash__status">Scanning plugin directories…</p>
    </div>
  )
}
