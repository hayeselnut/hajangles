import React, {useState} from 'react';
import ReactFlow, { isNode, isEdge, ReactFlowProvider } from 'react-flow-renderer';

import CustomNode1 from '../../components/customnode1.js';
import CustomNode2 from '../../components/customnode2.js';
import HeaderNode1 from '../../components/headernode1.js';

import HoverInfo from '../../components/hoverinfo.js';
import hoverPrerequisites from '../../components/hoverprerequisites.js';
import unhoverPrerequisites from '../../components/unhoverprerequisites.js';

import { Grid, Segment, Container, Dropdown, Header } from 'semantic-ui-react'
import Sidebar from "../../components/sidebar.js"
// import pkg from 'semantic-ui-react/package.json'

import DegreePlanner from "../../components/degreeplanner.js"
import DropdownSearch from "../../components/dropdownsearch.js"

import positionHelper from '../../components/positionhelper.js';
import selectNode from '../../components/selectnode.js';
import unselectNode from '../../components/unselectnode.js';
import highlightElements from '../../components/highlightelements.js';
import getSelectable from '../../components/getselectable.js';
import checkPrerequisites from '../../components/checkprerequisites';
import exclusionSwap from '../../components/exclusionswap.js';

import unselectUnconnected from '../../components/unselectunconnected.js';
import coursesJSON from "../../webscraper/courses.json";
import dataJSON from "./data.json"

const specialisations = ['COMPA1', 'FINSA2'];
var program = "3778";
var elementsData = dataJSON.slice();

// This is for dropdown search
var searchNodeOptions = [];
for (const course of elementsData) {
    if (isNode(course)) {
        searchNodeOptions.push({
            key: course.id,
            value: course.id,
            text: course.id
        });
    }
}

var nodesData = elementsData.filter(e => isNode(e));
var edgesData = elementsData.filter(e => isEdge(e));
var selectedNodes = {};
for (const specialisation of specialisations) selectedNodes[specialisation] = 1;

var selectedEdges = {};
var selectableNodes = {};
var potentialEdges = {};
var hoverEdges = {};

// Load up the chart with initial selectable nodes and edges
for (const node of nodesData) {
    if (selectedNodes.hasOwnProperty(node.id)) {
        if (node.data.unlocks === null) continue;
        for (const unlockCourse of node.data.unlocks) {
            potentialEdges['e' + node.id + '-' + unlockCourse] = 1;
        }
    } else if (checkPrerequisites(node, elementsData, selectedNodes)) {
        selectableNodes[node.id] = 1;
    }
}

var exclusionGroups = require("./data_exclusion.json");
var exclusionNodes = {};
for (const group of exclusionGroups) {
    for (const exclusion of group) {
        exclusionNodes[exclusion] = 1;
    }
}

elementsData = highlightElements(elementsData, selectedNodes, selectedEdges, selectableNodes, potentialEdges, hoverEdges);

const nodeTypes = {
    custom1: CustomNode1,
    custom2: CustomNode2,
    header1: HeaderNode1
};

const layoutStyle = {overflowX: "hidden", overflowY: "overlay", width: "100vw", height: "100vh"};

const getMoreCoursesForDropdown = (dataJSON) => {

    const moreOptions = [];
    const nodesOnFlowchart = dataJSON.map(node => node.id);
    // console.log("refresh", nodesOnFlowchart);

    for (const code in coursesJSON) {
        if (nodesOnFlowchart.includes(code)) continue;

        const name = coursesJSON[code].course_name;
        moreOptions.push({
            key: code,
            value: code,
            text: code + " - " + name
        });
    }

    return moreOptions;
}

const ComputerScienceCOMPA1FINSA2 = () => {
    const [elements, setElements] = useState(elementsData);
    const [hoverText, setHoverText] = useState(false);
    const [hoverNode, setHoverNode] = useState();
    const [layout, setLayout] = useState(layoutStyle);
    const [additionalCourses, setAdditionalCourses] = useState([])
    var clickCount = 0;
    var singleClickTimer = '';

    const onInstanceLoad = (instance) => {
        for (var group of exclusionGroups) {
            const last = group.pop();
    
            for (var course of elementsData) {
                if (last === course.id) {
                    course.isHidden = true;
                    // console.log("Hiding " + course.id);
                    // Get all the edges and hide them too
                    for (var edge of elementsData) {
                        if (isNode(edge)) continue;
                        if (edge.source === last || edge.target === last) {
                            // console.log("hiding " + edge.id);
                            edge.isHidden = true;
                        }
                    }
                    break;
                }
            }
            group.push(last);
        }
        instance.setTransform({x: 470, y: 350, zoom: 0.38});
    };

    const selectUnselect = (element) => {
        // NOTE: Might not need this?????
        // EXPLANATION: Reason we dont need it is because we have to leave node
        // anyways to hover another node. But maybe good practise to have just in case
        // Unhover edges which lit up on nodeMouseEnter
        unhoverPrerequisites(hoverEdges);

        // 1. Select the node and fill in edges.
        // - Deal with unselecting nodes
        if (selectableNodes.hasOwnProperty(element.id)) {
            console.log("MAINSELECT");
            selectNode(elements, element, selectedNodes, selectedEdges, selectableNodes, potentialEdges);
        } else if (selectedNodes.hasOwnProperty(element.id)) {
            console.log("UNSELECTING");
            unselectNode(elements, element, selectedNodes, selectedEdges, selectableNodes, potentialEdges);
            unselectUnconnected(elements, selectedNodes, selectedEdges, selectableNodes, potentialEdges);
        }

        console.log("==========SelectedNodes==========");
        console.log(selectedNodes);
        console.log("==========SelectedEdges==========");
        console.log(selectedEdges);
        console.log("==========SelectableNodes==========");
        console.log(selectableNodes);
        console.log("==========PotentialEdges==========");
        console.log(potentialEdges);

        // 2. Determine which nodes are now selectable
        // - Determine which previously selectable nodes are now unselectable
        getSelectable(elements, selectedNodes, selectedEdges, selectableNodes, potentialEdges);

        // Render graph accordingly
        setElements(highlightElements(elements, selectedNodes, selectedEdges, selectableNodes, potentialEdges, hoverEdges));
    }

    const toggleExclusion = (element) => {
        // TODO: ARE there courses which do not 
        // For all immediate edges of the element, swap
        // with the exclusion course
        setElements(exclusionSwap(element, elements, edgesData, selectedNodes, selectedEdges, selectableNodes, potentialEdges, hoverEdges, exclusionGroups));
        setElements(highlightElements(elements, selectedNodes, selectedEdges, selectableNodes, potentialEdges, hoverEdges));
    }


    // ==========ONCLICK==========
    const onElementClick = (event, element) => {
        // console.log("ONELEMENTCLICK");
        if (isEdge(element)) return; // Don't care about edges
        if (specialisations.includes(element.id)) return; // Cannot click on main node
        if ((! selectableNodes.hasOwnProperty(element.id)) && (! selectedNodes.hasOwnProperty(element.id))) return; // Cannot select non selectable nodes

        // Determine double or single click for exclusion nodes
        // This will prevent normal nodes from waiting the double click delay
        if (exclusionNodes.hasOwnProperty(element.id)) {
            clickCount++;
            if (clickCount === 1) {
                singleClickTimer = setTimeout(function() {
                    clickCount = 0;
                    selectUnselect(element);
                }, 250);
            } else if (clickCount === 2) {
                clearTimeout(singleClickTimer);
                clickCount = 0;
                toggleExclusion(element);
            }
        } else {
            // Not an exclusion node.
            selectUnselect(element);
        }
    };
    // ===========================

    // ==========ONHOVER==========
    const onNodeMouseEnter = (event, node) => {
        if (specialisations.includes(node.id)) return;
        // Display node information in top left
        setHoverText(true);
        setHoverNode(node);

        // If the node is unselected, highlight prerequisite edges in purple
        //if ((!selectedNodes.hasOwnProperty(node.id)) && (!selectableNodes.hasOwnProperty(node.id))) {
        hoverPrerequisites(node, elements, selectedNodes, selectedEdges, selectableNodes, potentialEdges, hoverEdges);
        //}
        setElements(highlightElements(elements, selectedNodes, selectedEdges, selectableNodes, potentialEdges, hoverEdges));
    }

    const onNodeMouseLeave = (event, node) => {
        if (specialisations.includes(node.id)) return;
        setHoverText(false);
        unhoverPrerequisites(hoverEdges);
        setElements(highlightElements(elements, selectedNodes, selectedEdges, selectableNodes, potentialEdges, hoverEdges));
    }


    let hoverDisplay;
    if (hoverText) {
        hoverDisplay = <HoverInfo node={hoverNode}/>
    }
    // ===========================

    // const onNodeDragStop = (event, node) => {
    //     for (var e of elements) {
    //         if (e.id === node.id) {
    //             e.position.x = node.position.x;
    //             e.position.y = node.position.y;
    //             break;
    //         }
    //     }
    // }

    const disableBodyScroll = () => {
        setLayout({...layout, overflowY: 'hidden'});
    }

    const enableBodyScroll = () => {
        setLayout({...layout, overflowY: 'overlay'});
    }

    return (
        <div style={{positon: "relative"}}>
            <div style={layout}>
                <Grid columns={2} divided>
                    <Grid.Column width="12">
                        <ReactFlowProvider>
                            <div onMouseEnter={disableBodyScroll} onMouseLeave={enableBodyScroll}>
                                <ReactFlow
                                    elements={elements}
                                    style={{width: '100%', height: '95vh'}}
                                    onLoad={onInstanceLoad}
                                    nodeTypes={nodeTypes}
                                    nodesConnectable={false}
                                    onElementClick={onElementClick}
                                    minZoom={0.38}
                                    //setInitTransform={TransformUpdater({x: 100, y: 100, z: 1})}
                                    nodesDraggable={true}
                                    onNodeMouseEnter={onNodeMouseEnter}
                                    onNodeMouseLeave={onNodeMouseLeave}
                                    selectNodesOnDrag={false}
                                    // onNodeDragStop={onNodeDragStop}
                                    elementsSelectable={false}
                                >
                                    <div style={{position: "absolute", zIndex: "10", top: "30px", right: "30px"}}>
                                        <DropdownSearch searchNodeOptions={searchNodeOptions} searchElements={elements}/>
                                    </div>
                                </ReactFlow>
                            </div>
                            <Container style={{marginBottom: "50px"}}>
                                <Segment raised>
                                    {/* <p>Couldn't find a course up there? Add it here:</p> */}
                                    <Header as="h5">Couldn't find a course up there? Add it here:</Header>
                                    <Dropdown
                                        selection
                                        multiple
                                        search
                                        fluid
                                        options={getMoreCoursesForDropdown(dataJSON)}
                                        onChange={(e, data) => setAdditionalCourses(data.value)}
                                        placeholder="Addditional courses"
                                    />
                                </Segment>
                            </Container>
                        </ReactFlowProvider>
                    </Grid.Column>
                    <Grid.Column width="4">
                        <Sidebar specialisations={specialisations} selectedNodes={selectedNodes}/>
                    </Grid.Column>
                </Grid>
                {hoverDisplay}
                {/* <button onClick={positionHelper(elements)}>GENERATE POSITION</button> */}
                <div id="DegreePlanner">
                    <DegreePlanner
                        key={Object.keys(selectedNodes).concat(additionalCourses).join("")}
                        program={program}
                        specialisations={specialisations}
                        selectedCourses={Object.keys(selectedNodes).concat(additionalCourses)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ComputerScienceCOMPA1FINSA2;