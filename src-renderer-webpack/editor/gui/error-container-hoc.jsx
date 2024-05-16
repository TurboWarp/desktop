import React from 'react';

const ErrorContainerHOC = function (WrappedComponent) {
  class ErrorContainerComponent extends React.Component {
    constructor (props) {
      super(props);

      this.state = {
        hasError: false,
        error: null
      };
    }

    static getDerivedStateFromError(error) {
      return {
        hasError: true,
        error
      };
    }

    render() {
      if (this.state.hasError) {
        let debugInformation = '';
        debugInformation += `Message: ${this.state.error}\n\n`;
        debugInformation += `Stack: ${this.state.error?.stack}\n\n`;
        debugInformation += `URL: ${location.href}\n\n`;
        debugInformation += `User-Agent: ${navigator.userAgent}`;

        return (
          <div style={{
            // Ensure this is always readable, regardless of where we are or the theme
            padding: '16px',
            backgroundColor: 'white',
            color: 'black'
          }}>
            <h1>{'Desktop React Error'}</h1>
            <p>
              {'If you can see this page, please '}
              <a href="https://github.com/TurboWarp/desktop/issues" target="_blank" rel="noreferrer">{'open a GitHub issue'}</a>
              {' or '}
              <a href="mailto:contact@turbowarp.org" target="_blank" rel="noreferrer">{'email us'}</a>
              {' with all the information below.'}
            </p>
            <pre>{debugInformation}</pre>
          </div>
        );
      }

      return (
        <WrappedComponent
          {...this.props}
        />
      );
    }
  }

  return ErrorContainerComponent;
};

export default ErrorContainerHOC;
