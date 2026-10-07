// Saves text as a file through the browser's download, entirely on the device.
export function downloadFile(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export const downloadJson = (fileName: string, data: unknown) => downloadFile(fileName, JSON.stringify(data), 'application/json')
