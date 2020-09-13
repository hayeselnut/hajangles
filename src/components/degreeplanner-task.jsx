import React from "react";
import { Label, Container } from 'semantic-ui-react'

import { Draggable } from "react-beautiful-dnd"

export default class Task extends React.Component {
    render () {
        return (
            <Container>
                <Draggable draggableId={this.props.task.id} index={this.props.index}>
                    {provided => (
                        <div>
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <Label>{this.props.task.content}</Label>
                            </div>
                            {provided.placeholder}
                        </div>
                    )}
                </Draggable>
            </Container>
        );
    }
}