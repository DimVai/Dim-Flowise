import { useSelector } from 'react-redux'

import Login from '@/views/auth/login'
import Chatflows from '@/views/chatflows'

/**
 * Component that redirects users to the first accessible page based on their permissions
 * This prevents 403 errors when users don't have access to the default chatflows page
 */
export const DefaultRedirect = () => {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

    // If user is not authenticated, show login page
    if (!isAuthenticated) {
        return <Login />
    }

    return <Chatflows />
}
