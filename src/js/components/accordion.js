'use strict';
import '../polyfills/Function/prototype/bind';
const toggle = require('../utils/toggle');
const isElementInViewport = require('../utils/is-in-viewport');
const BUTTON = `.accordion-button[aria-controls]`;
const EXPANDED = 'aria-expanded';
const MULTISELECTABLE = 'aria-multiselectable';
const MULTISELECTABLE_CLASS = 'accordion-multiselectable';
const BULK_FUNCTION_OPEN_TEXT = "Åbn alle";
const BULK_FUNCTION_CLOSE_TEXT = "Luk alle";
const BULK_FUNCTION_ACTION_ATTRIBUTE = "data-accordion-bulk-expand";

/**
 * Adds click functionality to accordion list
 * @param {HTMLElement} $accordion the accordion ul element
 */
function Accordion($accordion){
  if(!$accordion){
    throw new Error(`Missing accordion group element`);
  }
  this.accordion = $accordion;
}

/**
 * Set eventlisteners on click elements in accordion list
 */
Accordion.prototype.init = function(){
  this.buttons = this.accordion.querySelectorAll(BUTTON);
  if(this.buttons.length == 0){
    throw new Error(`Missing accordion buttons`);
  }

  // loop buttons in list
  for (var i = 0; i < this.buttons.length; i++){
    let currentButton = this.buttons[i];
    
    // Verify state on button and state on panel
    let expanded = currentButton.getAttribute(EXPANDED) === 'true';
    this.toggleButton(currentButton, expanded);
    
    // Set click event on accordion buttons
    currentButton.removeEventListener('click', this.eventOnClick.bind(this, currentButton), false);
    currentButton.addEventListener('click', this.eventOnClick.bind(this, currentButton), false);
    
    // Set click event on bulk button if present
    let prevSibling = this.accordion.previousElementSibling ;
    if(prevSibling !== null && prevSibling.classList.contains('accordion-bulk-button')){
      this.bulkFunctionButton = prevSibling;
      this.bulkFunctionButton.addEventListener('click', this.bulkEvent.bind(this));
    }
  }
}

/**
 * Bulk event handler: Triggered when clicking on .accordion-bulk-button
 */
Accordion.prototype.bulkEvent = function(){
  var $module = this;
  if(!$module.accordion.classList.contains('accordion')){  
    throw new Error(`Could not find accordion.`);
  }
  if($module.buttons.length == 0){
    throw new Error(`Missing accordion buttons`);
  }
    
  let expand = true;
  if($module.bulkFunctionButton.getAttribute(BULK_FUNCTION_ACTION_ATTRIBUTE) === "false") {
    expand = false;
  }
  for (var i = 0; i < $module.buttons.length; i++){
    $module.toggleButton($module.buttons[i], expand);
  }
  
  $module.bulkFunctionButton.setAttribute(BULK_FUNCTION_ACTION_ATTRIBUTE, !expand);
  if(!expand === true){
    $module.bulkFunctionButton.innerText = BULK_FUNCTION_OPEN_TEXT;
  } else{
    $module.bulkFunctionButton.innerText = BULK_FUNCTION_CLOSE_TEXT;
  }
}

/**
 * Accordion button event handler: Toggles accordion
 * @param {HTMLButtonElement} $button 
 * @param {PointerEvent} e 
 */
Accordion.prototype.eventOnClick = function ($button, e) {
  var $module = this;
  e.stopPropagation();
  e.preventDefault();
  $module.toggleButton($button);
  if ($button.getAttribute(EXPANDED) === 'true') {
    // We were just expanded, but if another accordion was also just
    // collapsed, we may no longer be in the viewport. This ensures
    // that we are still visible, so the user isn't confused.
    if (!isElementInViewport($button)) $button.scrollIntoView();
  }
}

/**
 * Toggle a button's "pressed" state, optionally providing a target
 * state.
 *
 * @param {HTMLButtonElement} button
 * @param {boolean?} expanded If no state is provided, the current
 * state will be toggled (from false to true, and vice-versa).
 * @return {boolean} the resulting state
 */
 Accordion.prototype.toggleButton = function (button, expanded) {
  let accordion = null;
  if(button.parentNode.parentNode.classList.contains('accordion')){
    accordion = button.parentNode.parentNode;
  } else if(button.parentNode.parentNode.parentNode.classList.contains('accordion')){
    accordion = button.parentNode.parentNode.parentNode;
  }

  expanded = toggle(button, expanded);
  if(expanded){    
    let eventOpen = new Event('fds.accordion.open');
    button.dispatchEvent(eventOpen);
  } else{
    let eventClose = new Event('fds.accordion.close');
    button.dispatchEvent(eventClose);
  }

  let multiselectable = false;
  if(accordion !== null && (accordion.getAttribute(MULTISELECTABLE) === 'true' || accordion.classList.contains(MULTISELECTABLE_CLASS))){
    multiselectable = true;
    let bulkFunction = accordion.previousElementSibling;
    if(bulkFunction !== null && bulkFunction.classList.contains('accordion-bulk-button')){
      let buttons = accordion.querySelectorAll(BUTTON);
      let buttonsOpen = accordion.querySelectorAll(BUTTON+'[aria-expanded="true"]');
      let buttonsClosed = accordion.querySelectorAll(BUTTON+'[aria-expanded="false"]');
      let newStatus = true;
      if(buttons.length === buttonsOpen.length){
        newStatus = false;
      }
      if(buttons.length === buttonsClosed.length){
        newStatus = true;
      }
      bulkFunction.setAttribute(BULK_FUNCTION_ACTION_ATTRIBUTE, newStatus);
      if(newStatus === true){
        bulkFunction.innerText = BULK_FUNCTION_OPEN_TEXT;
      } else{
        bulkFunction.innerText = BULK_FUNCTION_CLOSE_TEXT;
      }

    }
  }

  if (expanded && !multiselectable) {
    let buttons = [ button ];
    if(accordion !== null) {
      buttons = accordion.querySelectorAll(BUTTON);
    }
    for(let i = 0; i < buttons.length; i++) {
      let currentButtton = buttons[i];
      if (currentButtton !== button && currentButtton.getAttribute('aria-expanded' === true)) {
        toggle(currentButtton, false);
        let eventClose = new Event('fds.accordion.close');
        currentButtton.dispatchEvent(eventClose);
      }
    }
  }
};


export default Accordion;
