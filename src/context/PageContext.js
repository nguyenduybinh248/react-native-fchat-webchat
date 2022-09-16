import React, { createContext, PureComponent } from 'react'

export const PageDataContext = createContext()

export const withPageDataContext = (Chilldren) => {

    class ComponentWithPageData extends PureComponent {
        render() {
            return <PageDataContext.Consumer>
                {({pageData, closeWebChat}) => {
                    return <Chilldren {...this.props} pageData={pageData} closeWebChat={closeWebChat}/>
                }}
            </PageDataContext.Consumer>
        }
    }
    return ComponentWithPageData
}