/**
 * Loading spinner component
 */

import { Spin } from 'antd'

interface LoadingSpinnerProps {
  loading: boolean
  text?: string
  children?: React.ReactNode
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading,
  text = 'Cargando...',
  children,
}) => {
  return (
    <Spin spinning={loading} tip={text}>
      {children}
    </Spin>
  )
}
