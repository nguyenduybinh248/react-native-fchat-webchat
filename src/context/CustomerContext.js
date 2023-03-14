import React, { createContext, PureComponent } from 'react'

export const CustomerContext = createContext()

export const withCustomerContext = (Chilldren) => {

    class ComponentWithCustomer extends PureComponent {
        render() {
            return <CustomerContext.Consumer>
                {customerId => {
                    return <Chilldren {...this.props} customerId={customerId}/>
                }}
            </CustomerContext.Consumer>
        }
    }
    return ComponentWithCustomer
}