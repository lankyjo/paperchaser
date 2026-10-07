import { Component, type ReactNode } from 'react'
import { Button } from '../ui/button'

// Shows a retry message instead of a blank dialog when the preview fails to render.
export class PreviewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Preview failed to render. Try switching template or page size.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => this.setState({ failed: false })}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
