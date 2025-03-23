import { toast, ToastOptions } from 'react-hot-toast'

const defaultOptions: ToastOptions = {
  position: 'bottom-center',
  duration: 4000
}

export const toastService = {
  success (message: string, options?: ToastOptions) {
    return toast.success(message, { ...defaultOptions, ...options })
  },

  error (message: string, options?: ToastOptions) {
    return toast.error(message, { ...defaultOptions, ...options })
  },

  info (message: string, options?: ToastOptions) {
    return toast(message, { ...defaultOptions, ...options })
  },

  loading (message: string, options?: ToastOptions) {
    return toast.loading(message, { ...defaultOptions, ...options })
  },

  dismiss (toastId?: string) {
    toast.dismiss(toastId)
  }
}
