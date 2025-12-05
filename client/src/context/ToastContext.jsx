import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const push = useCallback((message, opts = {}) => {
        const id = Date.now() + Math.random()
        setToasts(t => [...t, { id, message, ...opts }])
        if (!opts.sticky) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 3500)
        return id
    }, [])

    const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

    return (
        <ToastContext.Provider value={{ push, remove }}>
            {children}
            <div className="toast-viewport">
                {toasts.map(t => (
                    <div className="toast" key={t.id} onClick={() => remove(t.id)}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)
