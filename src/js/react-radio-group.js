import React from 'react';
import PropTypes from 'prop-types';


export class Radio extends React.Component{
  render() {
    const {name, selectedValue, onChange} = this.context.radioGroup;
    const optional = {};
    if(selectedValue !== undefined) {
      optional.checked = (this.props.value === selectedValue);
    }
    if(typeof onChange === 'function') {
      optional.onChange = onChange.bind(null, this.props.value);
    }
    
    return (
    <input
    {...this.props}
    type="radio"
    name={name}
    {...optional} />
    );
  }
}
Radio.displayName = 'Radio';
Radio.contextTypes = {
  radioGroup: PropTypes.object
};


export class RadioGroup extends React.Component{
  constructor(props){
    super(props);
    this.getChildContext = this.getChildContext.bind(this);
  }
  getChildContext() {
    const {name, selectedValue, onChange} = this.props;
    return {
      radioGroup: {
        name, selectedValue, onChange
      }
    };
  }
  
  render() {
    const {Component, name, selectedValue, onChange, children, ...rest} = this.props; // eslint-disable-line no-unused-vars
    return <Component {...rest}>{children}</Component>;
  }
}
RadioGroup.displayName = 'RadioGroup';

RadioGroup.propTypes = {
  name: PropTypes.string,
  selectedValue: PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
  PropTypes.bool
  ]),
  onChange: PropTypes.func,
  children: PropTypes.node.isRequired,
  Component: PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.func,
  PropTypes.object
  ])
};

RadioGroup.defaultProps = {
  Component: 'div'
};

RadioGroup.childContextTypes = {
  radioGroup: PropTypes.object
};

