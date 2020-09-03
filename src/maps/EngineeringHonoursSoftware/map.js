import React, {useState} from 'react';
import ReactFlow, {Controls, getConnectedEdges, isNode, isEdge, useStoreState, useStoreActions, ReactFlowProvider} from 'react-flow-renderer';
import CustomNode1 from '../../components/customnode1.js';
import HeaderNode1 from '../../components/headernode1.js';
import '../../styles/nodeclass.css';

var elementsData = require("./data.json");
var elementsNode = elementsData.filter(e => isNode(e));
var elementsEdge = elementsData.filter(e => isEdge(e));
//const eng_data = require("../../webscraper/engineering_degrees.json");

console.log(elementsData);

const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView();
};

const nodeTypes = {
    custom1: CustomNode1,
    header1: HeaderNode1
};

const BESengah = () => {
    const [elements, setElements] = useState(elementsData);
    // HELPER FUNCTION FOR POSITIONING
    var positioning_data = [];
    const positionHelper = () => {
        for (const e of elements) {
            if (isNode(e)) {
                positioning_data.push({
                    id: e.id,
                    position: {x: e.position.x, y: e.position.y},
                });
            }
        }
        // Write data to position output file. Note we have to do this ourselves as we
        // are making a server write to a local file.
        console.log('[');
        for (const e of positioning_data) {
            console.log('{"id": "' + e.id + '", "position": {"x": ' + e.position.x + ', "y": ' + e.position.y + '}},');
        }
        console.log(']');
    }

    const onElementClick = (event, element) => {
        if (isEdge(element)) return; // Don't care about edges
        
        //console.log(element);
        //console.log(element.className);
        //console.log(event.target);
        
        //const setTransform = useStoreActions(actions => actions.updateTransform);
        //setTransform()  

        //useStoreActions(action => actions.updateTransform(useStoreState(state => state.transform)), [100, 100, 1]);
        highlightEdges(element);

        // Update the element's position for position helper
        for (var e of elements) {
            if (e.id === element.data.course_code) {
                e.position.x = element.position.x;
                e.position.y = element.position.y;
                console.log(e);
                break;
            }
        }
    };


    const highlightEdges = (element) => {
        if (isEdge(element)) return;
        //console.log("HIHIHIHI");
        const connectedEdges = getConnectedEdges([element], elementsEdge);
        //console.log(connectedEdges);
        //console.log(element);
        const connectedEdgeIds = connectedEdges.map(e => e.id);
        //console.log(connectedEdgeIds);

        //console.log(elements);

        setElements((els) => 
            els.map((e) => {
                //if (isEdge(e)) console.log(e.id);
                if (connectedEdgeIds.includes(e.id)) {
                    var stroke_colour;
                    if (e.style.stroke === 'grey') return {...e, style: {...e.style, stroke: 'red', opacity: 1}};
                    else if (e.style.stroke === 'red') return {...e, style: {...e.style, stroke: 'grey', opacity: 0.2}};
                }
                return e;
            })
        )
    }

    return (
        <div>
            <ReactFlowProvider>
                <ReactFlow
                    elements={elements}
                    style={{width: '100%', height: '90vh'}}
                    onLoad={onLoad}
                    nodeTypes={nodeTypes}
                    onElementClick={onElementClick}
                    nodesConnectable={false}
                    minZoom={0.1}
                    //setInitTransform={TransformUpdater({x: 100, y: 100, z: 1})}
                    // nodesDraggable={false}
                >
                    <Controls />
                </ReactFlow>
                <button type="button" onClick={positionHelper}>
                    Generate position
                </button>
            </ReactFlowProvider>
        </div>
    );
};

export default BESengah;