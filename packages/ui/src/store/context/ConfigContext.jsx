import PropTypes from 'prop-types'
import { createContext, useContext } from 'react'

const ConfigContext = createContext()

export const ConfigProvider = ({ children }) => {
    const config = { PLATFORM_TYPE: 'open source' }
    const loading = false
    const isEnterpriseLicensed = false
    const isCloud = false
    const isOpenSource = true

    return (
        <ConfigContext.Provider value={{ config, loading, isEnterpriseLicensed, isCloud, isOpenSource }}>{children}</ConfigContext.Provider>
    )
}

export const useConfig = () => useContext(ConfigContext)

ConfigProvider.propTypes = {
    children: PropTypes.any
}
