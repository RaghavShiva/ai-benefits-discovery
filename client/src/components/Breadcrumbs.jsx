import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Breadcrumbs() {
    const loc = useLocation()
    const parts = loc.pathname.split('/').filter(Boolean)

    return (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/" className="crumb">Home</Link>
            {parts.map((p, i) => {
                const to = '/' + parts.slice(0, i + 1).join('/')
                const label = p.replace(/-/g, ' ')
                return <Link key={to} to={to} className="crumb">/ {label}</Link>
            })}
        </nav>
    )
}
