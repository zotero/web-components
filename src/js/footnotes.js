'use strict';

let activateFootnotes = function() {
	const footnoteTriggers = document.querySelectorAll('sup[data-footnote]');
	const footnoteListEl = document.querySelector('#footnotes');
	const footnotes = footnoteListEl.querySelectorAll('li');
	const portalEl = document.body;
	var currentPopover;

	const openPopover = (triggerEl, footnoteEl) => {
		if(currentPopover) {
			currentPopover.destroy();
			currentPopover = null;
		}
		const popperContentEl = document.createElement('div');
		popperContentEl.classList.add('footnote', 'popover', 'bs-popover-auto', 'popover-body');
		popperContentEl.innerHTML = footnoteEl.innerHTML;
		const arrowEl = document.createElement('div');
		arrowEl.classList.add('arrow');
		popperContentEl.appendChild(arrowEl);
		portalEl.appendChild(popperContentEl);
		currentPopover = new Popper(triggerEl, popperContentEl, {
			placement: 'top',
			removeOnDestroy: true,
			modifiers: {
				arrow: {
					element: arrowEl
				}
			}
		});
	}

	portalEl.addEventListener('click', ev => {
		if(currentPopover && ev.target.closest('.popover') == null) {
			currentPopover.destroy();
			currentPopover = null;
		}
	});

	portalEl.addEventListener('keyup', ev => {
		if(currentPopover && (ev.key === "Escape" || ev.key === "Tab")) {
			currentPopover.destroy();
			currentPopover = null;
		}
	});

	footnoteTriggers.forEach(triggerEl => {
		if(typeof triggerEl.dataset.footnote === 'undefined') { return; }
		const footnoteId = parseInt(triggerEl.dataset.footnote, 10) - 1;
		const footnoteEl = footnotes[footnoteId];
		footnoteEl.id = `footnote-${footnoteId + 1}`;

		triggerEl.setAttribute('tabindex', 0);
		triggerEl.setAttribute('aria-label', `footnote ${footnoteId + 1}`);
		triggerEl.setAttribute('aria-describedby', footnoteEl.id);
		
		// attach event handler to open popovers
		triggerEl.addEventListener('click', ev => {
			openPopover(triggerEl, footnoteEl);
			ev.stopPropagation();
		});
		triggerEl.addEventListener('keyup', ev => {
			if(ev.key === "Enter" || ev.key === " ") {
				if(currentPopover && currentPopover.reference == triggerEl) {
					currentPopover.destroy();
					currentPopover = null;
				} else {
					openPopover(triggerEl, footnoteEl);
					ev.stopPropagation();
				}
			}
		});
	});
};

export {activateFootnotes};