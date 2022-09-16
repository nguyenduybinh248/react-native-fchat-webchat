import React, { createContext, PureComponent } from 'react'

export const SocketContext = createContext()

export const withSocketContext = (Chilldren) => {

    class ComponentWithSocket extends PureComponent {
        render() {
            return <SocketContext.Consumer>
                {socket => {
                    return <Chilldren {...this.props} socket={socket}/>
                }}
            </SocketContext.Consumer>
        }
    }
    return ComponentWithSocket
}