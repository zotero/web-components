'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('ButtonEditable');

import {useState} from 'react';
import {Form, Button, Input, InputGroup, InputGroupAddon} from 'reactstrap';

function ButtonEditable(props){
	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState(props.value);
	
	const {save, value} = props;
	const submit = (evt) => {
		evt.preventDefault();
		save(editValue); setEditing(false);
	};
	if(!editing){
		return (
			<InputGroup>
				<Input className='button-editable-input' disabled value={value} />
				<InputGroupAddon addonType="append">
					<Button type='button' size='sm' onClick={()=>{setEditing(true);}}>Edit</Button>
				</InputGroupAddon>
			</InputGroup>
		);
	} else {
		return (
			<div className='button-editable'>
				<Form onSubmit={submit}>
					<InputGroup>
						<Input className='button-editable-input' defaultValue={value} autoFocus onChange={(evt)=>{setEditValue(evt.target.value);}} />
						<InputGroupAddon addonType="append">
							<Button type='button' size='sm' onClick={submit}>Save</Button>
						</InputGroupAddon>
					</InputGroup>
				</Form>
			</div>
		);
	}
}

export {ButtonEditable};
