'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('ButtonEditable');

const React = require('react');
const {Component} = React;

class ButtonEditable extends Component{
	constructor(props){
		super(props);
		this.state = {
			editing:false,
			editValue:props.value
		};
	}
	render(){
		const {save, value} = this.props;
		const {editing, editValue} = this.state;

		if(!editing){
			return (
				<div className='button-editable'>
					<div className='button-editable-flex'>
						<span className='button-editable-value'>{value}</span>
						<button className='button-editable-edit btn' onClick={()=>{this.setState({'editing':true});}}>Edit</button>
					</div>
				</div>				
			);
		} else {
			return (
				<div className='button-editable'>
					<div className='button-editable-flex'>
						<input className='button-editable-input form-control' defaultValue={value} onChange={(evt)=>{this.setState({editValue:evt.target.value});}} />
						<button className='button-editable-save btn' onClick={()=>{save(editValue); this.setState({editing:false});}}>Save</button>
					</div>
				</div>
			);
		}
	}
}

export {ButtonEditable};
