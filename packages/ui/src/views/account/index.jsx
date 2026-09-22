import { Stack, Typography } from '@mui/material'

import ViewHeader from '@/layout/MainLayout/ViewHeader'
import MainCard from '@/ui-component/cards/MainCard'

const AccountSettings = () => (
    <MainCard maxWidth='md'>
        <Stack flexDirection='column' sx={{ gap: 4 }}>
            <ViewHeader title='Account Settings' />
            <Typography>
                Account credentials are configured through the FLOWISE_USERNAME and FLOWISE_PASSWORD environment variables. Update them on
                the server and restart Flowise to change your sign-in details.
            </Typography>
        </Stack>
    </MainCard>
)

export default AccountSettings
