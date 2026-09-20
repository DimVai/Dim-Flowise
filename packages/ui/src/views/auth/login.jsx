import { useEffect, useState } from 'react'

// material-ui
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'

// project imports
import MainCard from '@/ui-component/cards/MainCard'

// API
import authApi from '@/api/auth'

// Hooks
import useApi from '@/hooks/useApi'

// store
import { loginSuccess } from '@/store/reducers/authSlice'
import { store } from '@/store'

// ==============================|| ResolveLoginPage ||============================== //

const ResolveLoginPage = () => {
    const resolveLogin = useApi(authApi.resolveLogin)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(false)
    }, [resolveLogin.error])

    useEffect(() => {
        resolveLogin.request({})
        setLoading(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setLoading(false)
        if (resolveLogin.data) {
            if (resolveLogin.data.user) {
                store.dispatch(loginSuccess(resolveLogin.data.user))
            }
            window.location.href = resolveLogin.data.redirectUrl
        }
    }, [resolveLogin.data])

    return (
        <>
            <MainCard maxWidth='md'>{loading && <BackdropLoader open={loading} />}</MainCard>
        </>
    )
}

export default ResolveLoginPage
