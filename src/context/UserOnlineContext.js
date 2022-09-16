import React, { createContext, PureComponent } from 'react'

export const UserOnlineContext = createContext()

export const withUserOnlineContext = (Chilldren) => {

    class ComponentWithUserOnline extends PureComponent {
        render() {
            return <UserOnlineContext.Consumer>
                {online_users => {
                    return <Chilldren {...this.props} onlineUsers={online_users}/>
                }}
            </UserOnlineContext.Consumer>
        }
    }
    return ComponentWithUserOnline
}