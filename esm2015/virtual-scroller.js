import { __decorate, __param } from "tslib";
import { ChangeDetectorRef, Component, ContentChild, DoCheck, ElementRef, EventEmitter, Inject, Input, NgModule, NgZone, OnChanges, OnDestroy, OnInit, Optional, Output, Renderer2, ViewChild, } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { CommonModule } from '@angular/common';
import * as tween from '@tweenjs/tween.js';
export function VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY() {
    return {
        checkResizeInterval: 1000,
        modifyOverflowStyleOfParentScroll: true,
        resizeBypassRefreshThreshold: 5,
        scrollAnimationTime: 750,
        scrollDebounceTime: 0,
        scrollThrottlingTime: 0,
        stripedTable: false
    };
}
let VirtualScrollerComponent = class VirtualScrollerComponent {
    constructor(element, renderer, zone, changeDetectorRef, 
    // tslint:disable-next-line:ban-types
    platformId, options) {
        this.element = element;
        this.renderer = renderer;
        this.zone = zone;
        this.changeDetectorRef = changeDetectorRef;
        this.window = window;
        this.executeRefreshOutsideAngularZone = false;
        this._enableUnequalChildrenSizes = false;
        this.RTL = false;
        this.useMarginInsteadOfTranslate = false;
        this.ssrViewportWidth = 1920;
        this.ssrViewportHeight = 1080;
        this._items = [];
        this.vsUpdate = new EventEmitter();
        this.vsChange = new EventEmitter();
        this.vsStart = new EventEmitter();
        this.vsEnd = new EventEmitter();
        this.calculatedScrollbarWidth = 0;
        this.calculatedScrollbarHeight = 0;
        this.padding = 0;
        this.previousViewPort = {};
        this.cachedPageSize = 0;
        this.previousScrollNumberElements = 0;
        this.compareItems = (item1, item2) => item1 === item2;
        this.isAngularUniversalSSR = isPlatformServer(platformId);
        this.checkResizeInterval = options.checkResizeInterval;
        this.modifyOverflowStyleOfParentScroll = options.modifyOverflowStyleOfParentScroll;
        this.resizeBypassRefreshThreshold = options.resizeBypassRefreshThreshold;
        this.scrollAnimationTime = options.scrollAnimationTime;
        this.scrollDebounceTime = options.scrollDebounceTime;
        this.scrollThrottlingTime = options.scrollThrottlingTime;
        this.scrollbarHeight = options.scrollbarHeight;
        this.scrollbarWidth = options.scrollbarWidth;
        this.stripedTable = options.stripedTable;
        this.horizontal = false;
        this.resetWrapGroupDimensions();
    }
    get viewPortInfo() {
        const pageInfo = this.previousViewPort || {};
        return {
            startIndex: pageInfo.startIndex || 0,
            endIndex: pageInfo.endIndex || 0,
            scrollStartPosition: pageInfo.scrollStartPosition || 0,
            scrollEndPosition: pageInfo.scrollEndPosition || 0,
            maxScrollPosition: pageInfo.maxScrollPosition || 0,
            startIndexWithBuffer: pageInfo.startIndexWithBuffer || 0,
            endIndexWithBuffer: pageInfo.endIndexWithBuffer || 0
        };
    }
    get enableUnequalChildrenSizes() {
        return this._enableUnequalChildrenSizes;
    }
    set enableUnequalChildrenSizes(value) {
        if (this._enableUnequalChildrenSizes === value) {
            return;
        }
        this._enableUnequalChildrenSizes = value;
        this.minMeasuredChildWidth = undefined;
        this.minMeasuredChildHeight = undefined;
    }
    get bufferAmount() {
        if (typeof (this._bufferAmount) === 'number' && this._bufferAmount >= 0) {
            return this._bufferAmount;
        }
        else {
            return this.enableUnequalChildrenSizes ? 5 : 0;
        }
    }
    set bufferAmount(value) {
        this._bufferAmount = value;
    }
    get scrollThrottlingTime() {
        return this._scrollThrottlingTime;
    }
    set scrollThrottlingTime(value) {
        this._scrollThrottlingTime = value;
        this.updateOnScrollFunction();
    }
    get scrollDebounceTime() {
        return this._scrollDebounceTime;
    }
    set scrollDebounceTime(value) {
        this._scrollDebounceTime = value;
        this.updateOnScrollFunction();
    }
    get checkResizeInterval() {
        return this._checkResizeInterval;
    }
    set checkResizeInterval(value) {
        if (this._checkResizeInterval === value) {
            return;
        }
        this._checkResizeInterval = value;
        this.addScrollEventHandlers();
    }
    get items() {
        return this._items;
    }
    set items(value) {
        if (value === this._items) {
            return;
        }
        this._items = value || [];
        this.refresh_internal(true);
    }
    get horizontal() {
        return this._horizontal;
    }
    set horizontal(value) {
        this._horizontal = value;
        this.updateDirection();
    }
    get parentScroll() {
        return this._parentScroll;
    }
    set parentScroll(value) {
        if (this._parentScroll === value) {
            return;
        }
        this.revertParentOverscroll();
        this._parentScroll = value;
        this.addScrollEventHandlers();
        const scrollElement = this.getScrollElement();
        if (this.modifyOverflowStyleOfParentScroll && scrollElement !== this.element.nativeElement) {
            this.oldParentScrollOverflow = { x: scrollElement.style['overflow-x'], y: scrollElement.style['overflow-y'] };
            scrollElement.style['overflow-y'] = this.horizontal ? 'visible' : 'auto';
            scrollElement.style['overflow-x'] = this.horizontal ? 'auto' : 'visible';
        }
    }
    updateOnScrollFunction() {
        if (this.scrollDebounceTime) {
            this.onScroll = this.debounce(() => {
                this.refresh_internal(false);
            }, this.scrollDebounceTime);
        }
        else if (this.scrollThrottlingTime) {
            this.onScroll = this.throttleTrailing(() => {
                this.refresh_internal(false);
            }, this.scrollThrottlingTime);
        }
        else {
            this.onScroll = () => {
                this.refresh_internal(false);
            };
        }
    }
    revertParentOverscroll() {
        const scrollElement = this.getScrollElement();
        if (scrollElement && this.oldParentScrollOverflow) {
            scrollElement.style['overflow-y'] = this.oldParentScrollOverflow.y;
            scrollElement.style['overflow-x'] = this.oldParentScrollOverflow.x;
        }
        this.oldParentScrollOverflow = undefined;
    }
    ngOnInit() {
        this.addScrollEventHandlers();
    }
    ngOnDestroy() {
        this.removeScrollEventHandlers();
        this.revertParentOverscroll();
    }
    ngOnChanges(changes) {
        const indexLengthChanged = this.cachedItemsLength !== this.items.length;
        this.cachedItemsLength = this.items.length;
        const firstRun = !changes.items || !changes.items.previousValue || changes.items.previousValue.length === 0;
        this.refresh_internal(indexLengthChanged || firstRun);
    }
    ngDoCheck() {
        if (this.cachedItemsLength !== this.items.length) {
            this.cachedItemsLength = this.items.length;
            this.refresh_internal(true);
            return;
        }
        if (this.previousViewPort && this.viewPortItems && this.viewPortItems.length > 0) {
            let itemsArrayChanged = false;
            for (let i = 0; i < this.viewPortItems.length; ++i) {
                if (!this.compareItems(this.items[this.previousViewPort.startIndexWithBuffer + i], this.viewPortItems[i])) {
                    itemsArrayChanged = true;
                    break;
                }
            }
            if (itemsArrayChanged) {
                this.refresh_internal(true);
            }
        }
    }
    refresh() {
        this.refresh_internal(true);
    }
    invalidateAllCachedMeasurements() {
        this.wrapGroupDimensions = {
            maxChildSizePerWrapGroup: [],
            numberOfKnownWrapGroupChildSizes: 0,
            sumOfKnownWrapGroupChildWidths: 0,
            sumOfKnownWrapGroupChildHeights: 0
        };
        this.minMeasuredChildWidth = undefined;
        this.minMeasuredChildHeight = undefined;
        this.refresh_internal(false);
    }
    invalidateCachedMeasurementForItem(item) {
        if (this.enableUnequalChildrenSizes) {
            const index = this.items && this.items.indexOf(item);
            if (index >= 0) {
                this.invalidateCachedMeasurementAtIndex(index);
            }
        }
        else {
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        }
        this.refresh_internal(false);
    }
    invalidateCachedMeasurementAtIndex(index) {
        if (this.enableUnequalChildrenSizes) {
            const cachedMeasurement = this.wrapGroupDimensions.maxChildSizePerWrapGroup[index];
            if (cachedMeasurement) {
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[index] = undefined;
                --this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= cachedMeasurement.childWidth || 0;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= cachedMeasurement.childHeight || 0;
            }
        }
        else {
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        }
        this.refresh_internal(false);
    }
    scrollInto(item, alignToBeginning = true, additionalOffset = 0, animationMilliseconds, animationCompletedCallback) {
        const index = this.items.indexOf(item);
        if (index === -1) {
            return;
        }
        this.scrollToIndex(index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback);
    }
    scrollToIndex(index, alignToBeginning = true, additionalOffset = 0, animationMilliseconds, animationCompletedCallback) {
        let maxRetries = 5;
        const retryIfNeeded = () => {
            --maxRetries;
            if (maxRetries <= 0) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            const dimensions = this.calculateDimensions();
            const desiredStartIndex = Math.min(Math.max(index, 0), dimensions.itemCount - 1);
            if (this.previousViewPort.startIndex === desiredStartIndex) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, 0, retryIfNeeded);
        };
        this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, animationMilliseconds, retryIfNeeded);
    }
    scrollToIndex_internal(index, alignToBeginning = true, additionalOffset = 0, animationMilliseconds, animationCompletedCallback) {
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        const dimensions = this.calculateDimensions();
        let scroll = this.calculatePadding(index, dimensions) + additionalOffset;
        if (!alignToBeginning) {
            scroll -= dimensions.wrapGroupsPerPage * dimensions[this._childScrollDim];
        }
        this.scrollToPosition(scroll, animationMilliseconds, animationCompletedCallback);
    }
    scrollToPosition(scrollPosition, animationMilliseconds, animationCompletedCallback) {
        scrollPosition += this.getElementsOffset();
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        const scrollElement = this.getScrollElement();
        let animationRequest;
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = undefined;
        }
        if (!animationMilliseconds) {
            this.renderer.setProperty(scrollElement, this._scrollType, scrollPosition);
            this.refresh_internal(false, animationCompletedCallback);
            return;
        }
        const tweenConfigObj = { scrollPosition: scrollElement[this._scrollType] };
        const newTween = new tween.Tween(tweenConfigObj)
            .to({ scrollPosition }, animationMilliseconds)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate((data) => {
            if (isNaN(data.scrollPosition)) {
                return;
            }
            this.renderer.setProperty(scrollElement, this._scrollType, data.scrollPosition);
            this.refresh_internal(false);
        })
            .onStop(() => {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        const animate = (time) => {
            if (!newTween.isPlaying()) {
                return;
            }
            newTween.update(time);
            if (tweenConfigObj.scrollPosition === scrollPosition) {
                this.refresh_internal(false, animationCompletedCallback);
                return;
            }
            this.zone.runOutsideAngular(() => {
                animationRequest = requestAnimationFrame(animate);
            });
        };
        animate();
        this.currentTween = newTween;
    }
    getElementSize(element) {
        const result = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        const marginTop = parseInt(styles['margin-top'], 10) || 0;
        const marginBottom = parseInt(styles['margin-bottom'], 10) || 0;
        const marginLeft = parseInt(styles['margin-left'], 10) || 0;
        const marginRight = parseInt(styles['margin-right'], 10) || 0;
        return {
            top: result.top + marginTop,
            bottom: result.bottom + marginBottom,
            left: result.left + marginLeft,
            right: result.right + marginRight,
            width: result.width + marginLeft + marginRight,
            height: result.height + marginTop + marginBottom
        };
    }
    checkScrollElementResized() {
        const boundingRect = this.getElementSize(this.getScrollElement());
        let sizeChanged;
        if (!this.previousScrollBoundingRect) {
            sizeChanged = true;
        }
        else {
            const widthChange = Math.abs(boundingRect.width - this.previousScrollBoundingRect.width);
            const heightChange = Math.abs(boundingRect.height - this.previousScrollBoundingRect.height);
            sizeChanged = widthChange > this.resizeBypassRefreshThreshold || heightChange > this.resizeBypassRefreshThreshold;
        }
        if (sizeChanged) {
            this.previousScrollBoundingRect = boundingRect;
            if (boundingRect.width > 0 && boundingRect.height > 0) {
                this.refresh_internal(false);
            }
        }
    }
    updateDirection() {
        if (this.horizontal) {
            this._childScrollDim = 'childWidth';
            this._invisiblePaddingProperty = 'scaleX';
            this._marginDir = 'margin-left';
            this._offsetType = 'offsetLeft';
            this._pageOffsetType = 'pageXOffset';
            this._scrollType = 'scrollLeft';
            this._translateDir = 'translateX';
        }
        else {
            this._childScrollDim = 'childHeight';
            this._invisiblePaddingProperty = 'scaleY';
            this._marginDir = 'margin-top';
            this._offsetType = 'offsetTop';
            this._pageOffsetType = 'pageYOffset';
            this._scrollType = 'scrollTop';
            this._translateDir = 'translateY';
        }
    }
    debounce(func, wait) {
        const throttled = this.throttleTrailing(func, wait);
        const result = function () {
            throttled.cancel();
            throttled.apply(this, arguments);
        };
        result.cancel = () => {
            throttled.cancel();
        };
        return result;
    }
    throttleTrailing(func, wait) {
        let timeout;
        let _arguments = arguments;
        const result = function () {
            const _this = this;
            _arguments = arguments;
            if (timeout) {
                return;
            }
            if (wait <= 0) {
                func.apply(_this, _arguments);
            }
            else {
                timeout = setTimeout(() => {
                    timeout = undefined;
                    func.apply(_this, _arguments);
                }, wait);
            }
        };
        result.cancel = () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
        };
        return result;
    }
    refresh_internal(itemsArrayModified, refreshCompletedCallback, maxRunTimes = 2) {
        // note: maxRunTimes is to force it to keep recalculating if the previous iteration caused a re-render
        //       (different sliced items in viewport or scrollPosition changed).
        // The default of 2x max will probably be accurate enough without causing too large a performance bottleneck
        // The code would typically quit out on the 2nd iteration anyways. The main time it'd think more than 2 runs
        // would be necessary would be for vastly different sized child items or if this is the 1st time the items array
        // was initialized.
        // Without maxRunTimes, If the user is actively scrolling this code would become an infinite loop until they
        // stopped scrolling. This would be okay, except each scroll event would start an additional infinite loop. We
        // want to short-circuit it to prevent this.
        if (itemsArrayModified && this.previousViewPort && this.previousViewPort.scrollStartPosition > 0) {
            // if items were prepended, scroll forward to keep same items visible
            const oldViewPort = this.previousViewPort;
            const oldViewPortItems = this.viewPortItems;
            const oldRefreshCompletedCallback = refreshCompletedCallback;
            refreshCompletedCallback = () => {
                const scrollLengthDelta = this.previousViewPort.scrollLength - oldViewPort.scrollLength;
                if (scrollLengthDelta > 0 && this.viewPortItems) {
                    const offset = this.previousViewPort.startIndex - this.previousViewPort.startIndexWithBuffer;
                    const oldStartItem = oldViewPortItems[offset];
                    const oldStartItemIndex = this.items.findIndex(x => this.compareItems(oldStartItem, x));
                    if (oldStartItemIndex > this.previousViewPort.startIndex) {
                        let itemOrderChanged = false;
                        for (let i = 1, l = this.viewPortItems.length - offset; i < l; ++i) {
                            if (!this.compareItems(this.items[oldStartItemIndex + i], oldViewPortItems[offset + i])) {
                                itemOrderChanged = true;
                                break;
                            }
                        }
                        if (!itemOrderChanged) {
                            this.scrollToPosition(this.previousViewPort.scrollStartPosition + scrollLengthDelta, 0, oldRefreshCompletedCallback);
                            return;
                        }
                    }
                }
                if (oldRefreshCompletedCallback) {
                    oldRefreshCompletedCallback();
                }
            };
        }
        this.zone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
                if (itemsArrayModified) {
                    this.resetWrapGroupDimensions();
                }
                const viewport = this.calculateViewport();
                const startChanged = itemsArrayModified || viewport.startIndex !== this.previousViewPort.startIndex;
                const endChanged = itemsArrayModified || viewport.endIndex !== this.previousViewPort.endIndex;
                const scrollLengthChanged = viewport.scrollLength !== this.previousViewPort.scrollLength;
                const paddingChanged = viewport.padding !== this.previousViewPort.padding;
                const scrollPositionChanged = viewport.scrollStartPosition !== this.previousViewPort.scrollStartPosition ||
                    viewport.scrollEndPosition !== this.previousViewPort.scrollEndPosition ||
                    viewport.maxScrollPosition !== this.previousViewPort.maxScrollPosition;
                this.previousViewPort = viewport;
                if (scrollLengthChanged) {
                    this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, 'transform', `${this._invisiblePaddingProperty}(${viewport.scrollLength})`);
                    this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, 'webkitTransform', `${this._invisiblePaddingProperty}(${viewport.scrollLength})`);
                }
                if (paddingChanged) {
                    if (this.useMarginInsteadOfTranslate) {
                        this.renderer.setStyle(this.contentElementRef.nativeElement, this._marginDir, `${viewport.padding}px`);
                    }
                    else {
                        this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `${this._translateDir}(${viewport.padding}px)`);
                        this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${viewport.padding}px)`);
                    }
                }
                if (this.headerElementRef) {
                    const scrollPosition = this.getScrollElement()[this._scrollType];
                    const containerOffset = this.getElementsOffset();
                    const offset = Math.max(scrollPosition - viewport.padding - containerOffset +
                        this.headerElementRef.nativeElement.clientHeight, 0);
                    this.renderer.setStyle(this.headerElementRef.nativeElement, 'transform', `${this._translateDir}(${offset}px)`);
                    this.renderer.setStyle(this.headerElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${offset}px)`);
                }
                const changeEventArg = (startChanged || endChanged) ? {
                    startIndex: viewport.startIndex,
                    endIndex: viewport.endIndex,
                    scrollStartPosition: viewport.scrollStartPosition,
                    scrollEndPosition: viewport.scrollEndPosition,
                    startIndexWithBuffer: viewport.startIndexWithBuffer,
                    endIndexWithBuffer: viewport.endIndexWithBuffer,
                    maxScrollPosition: viewport.maxScrollPosition
                } : undefined;
                if (startChanged || endChanged || scrollPositionChanged) {
                    const handleChanged = () => {
                        // update the scroll list to trigger re-render of components in viewport
                        this.viewPortItems = viewport.startIndexWithBuffer >= 0 && viewport.endIndexWithBuffer >= 0 ?
                            this.items.slice(viewport.startIndexWithBuffer, viewport.endIndexWithBuffer + 1) : [];
                        this.vsUpdate.emit(this.viewPortItems);
                        if (startChanged) {
                            this.vsStart.emit(changeEventArg);
                        }
                        if (endChanged) {
                            this.vsEnd.emit(changeEventArg);
                        }
                        if (startChanged || endChanged) {
                            this.changeDetectorRef.markForCheck();
                            this.vsChange.emit(changeEventArg);
                        }
                        if (maxRunTimes > 0) {
                            this.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                            return;
                        }
                        if (refreshCompletedCallback) {
                            refreshCompletedCallback();
                        }
                    };
                    if (this.executeRefreshOutsideAngularZone) {
                        handleChanged();
                    }
                    else {
                        this.zone.run(handleChanged);
                    }
                }
                else {
                    if (maxRunTimes > 0 && (scrollLengthChanged || paddingChanged)) {
                        this.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                        return;
                    }
                    if (refreshCompletedCallback) {
                        refreshCompletedCallback();
                    }
                }
            });
        });
    }
    getScrollElement() {
        return this.parentScroll instanceof Window ? document.scrollingElement || document.documentElement ||
            document.body : this.parentScroll || this.element.nativeElement;
    }
    addScrollEventHandlers() {
        if (this.isAngularUniversalSSR) {
            return;
        }
        const scrollElement = this.getScrollElement();
        this.removeScrollEventHandlers();
        this.zone.runOutsideAngular(() => {
            if (this.parentScroll instanceof Window) {
                this.disposeScrollHandler = this.renderer.listen('window', 'scroll', this.onScroll);
                this.disposeResizeHandler = this.renderer.listen('window', 'resize', this.onScroll);
            }
            else {
                this.disposeScrollHandler = this.renderer.listen(scrollElement, 'scroll', this.onScroll);
                if (this._checkResizeInterval > 0) {
                    this.checkScrollElementResizedTimer = setInterval(() => {
                        this.checkScrollElementResized();
                    }, this._checkResizeInterval);
                }
            }
        });
    }
    removeScrollEventHandlers() {
        if (this.checkScrollElementResizedTimer) {
            clearInterval(this.checkScrollElementResizedTimer);
        }
        if (this.disposeScrollHandler) {
            this.disposeScrollHandler();
            this.disposeScrollHandler = undefined;
        }
        if (this.disposeResizeHandler) {
            this.disposeResizeHandler();
            this.disposeResizeHandler = undefined;
        }
    }
    getElementsOffset() {
        if (this.isAngularUniversalSSR) {
            return 0;
        }
        let offset = 0;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            offset += this.containerElementRef.nativeElement[this._offsetType];
        }
        if (this.parentScroll) {
            const scrollElement = this.getScrollElement();
            const elementClientRect = this.getElementSize(this.element.nativeElement);
            const scrollClientRect = this.getElementSize(scrollElement);
            if (this.horizontal) {
                offset += elementClientRect.left - scrollClientRect.left;
            }
            else {
                offset += elementClientRect.top - scrollClientRect.top;
            }
            if (!(this.parentScroll instanceof Window)) {
                offset += scrollElement[this._scrollType];
            }
        }
        return offset;
    }
    countItemsPerWrapGroup() {
        if (this.isAngularUniversalSSR) {
            return Math.round(this.horizontal ? this.ssrViewportHeight / this.ssrChildHeight : this.ssrViewportWidth / this.ssrChildWidth);
        }
        const propertyName = this.horizontal ? 'offsetLeft' : 'offsetTop';
        const children = ((this.containerElementRef && this.containerElementRef.nativeElement) ||
            this.contentElementRef.nativeElement).children;
        const childrenLength = children ? children.length : 0;
        if (childrenLength === 0) {
            return 1;
        }
        const firstOffset = children[0][propertyName];
        let result = 1;
        while (result < childrenLength && firstOffset === children[result][propertyName]) {
            ++result;
        }
        return result;
    }
    getScrollStartPosition() {
        let windowScrollValue;
        if (this.parentScroll instanceof Window) {
            windowScrollValue = window[this._pageOffsetType];
        }
        return windowScrollValue || this.getScrollElement()[this._scrollType] || 0;
    }
    resetWrapGroupDimensions() {
        const oldWrapGroupDimensions = this.wrapGroupDimensions;
        this.invalidateAllCachedMeasurements();
        if (!this.enableUnequalChildrenSizes || !oldWrapGroupDimensions || oldWrapGroupDimensions.numberOfKnownWrapGroupChildSizes === 0) {
            return;
        }
        const itemsPerWrapGroup = this.countItemsPerWrapGroup();
        for (let wrapGroupIndex = 0; wrapGroupIndex < oldWrapGroupDimensions.maxChildSizePerWrapGroup.length; ++wrapGroupIndex) {
            const oldWrapGroupDimension = oldWrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
            if (!oldWrapGroupDimension || !oldWrapGroupDimension.items || !oldWrapGroupDimension.items.length) {
                continue;
            }
            if (oldWrapGroupDimension.items.length !== itemsPerWrapGroup) {
                return;
            }
            let itemsChanged = false;
            const arrayStartIndex = itemsPerWrapGroup * wrapGroupIndex;
            for (let i = 0; i < itemsPerWrapGroup; ++i) {
                if (!this.compareItems(oldWrapGroupDimension.items[i], this.items[arrayStartIndex + i])) {
                    itemsChanged = true;
                    break;
                }
            }
            if (!itemsChanged) {
                ++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += oldWrapGroupDimension.childWidth || 0;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += oldWrapGroupDimension.childHeight || 0;
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = oldWrapGroupDimension;
            }
        }
    }
    calculateDimensions() {
        const scrollElement = this.getScrollElement();
        const maxCalculatedScrollBarSize = 25; // Note: Formula to auto-calculate doesn't work for ParentScroll,
        //       so we default to this if not set by consuming application
        this.calculatedScrollbarHeight = Math.max(Math.min(scrollElement.offsetHeight - scrollElement.clientHeight, maxCalculatedScrollBarSize), this.calculatedScrollbarHeight);
        this.calculatedScrollbarWidth = Math.max(Math.min(scrollElement.offsetWidth - scrollElement.clientWidth, maxCalculatedScrollBarSize), this.calculatedScrollbarWidth);
        let viewportWidth = scrollElement.offsetWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth ||
            (this.horizontal ? 0 : maxCalculatedScrollBarSize));
        let viewportHeight = scrollElement.offsetHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight ||
            (this.horizontal ? maxCalculatedScrollBarSize : 0));
        const content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        const itemsPerWrapGroup = this.countItemsPerWrapGroup();
        let wrapGroupsPerPage;
        let defaultChildWidth;
        let defaultChildHeight;
        if (this.isAngularUniversalSSR) {
            viewportWidth = this.ssrViewportWidth;
            viewportHeight = this.ssrViewportHeight;
            defaultChildWidth = this.ssrChildWidth;
            defaultChildHeight = this.ssrChildHeight;
            const itemsPerRow = Math.max(Math.ceil(viewportWidth / defaultChildWidth), 1);
            const itemsPerCol = Math.max(Math.ceil(viewportHeight / defaultChildHeight), 1);
            wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
        }
        else if (!this.enableUnequalChildrenSizes) {
            if (content.children.length > 0) {
                if (!this.childWidth || !this.childHeight) {
                    if (!this.minMeasuredChildWidth && viewportWidth > 0) {
                        this.minMeasuredChildWidth = viewportWidth;
                    }
                    if (!this.minMeasuredChildHeight && viewportHeight > 0) {
                        this.minMeasuredChildHeight = viewportHeight;
                    }
                }
                const child = content.children[0];
                const clientRect = this.getElementSize(child);
                this.minMeasuredChildWidth = Math.min(this.minMeasuredChildWidth, clientRect.width);
                this.minMeasuredChildHeight = Math.min(this.minMeasuredChildHeight, clientRect.height);
            }
            defaultChildWidth = this.childWidth || this.minMeasuredChildWidth || viewportWidth;
            defaultChildHeight = this.childHeight || this.minMeasuredChildHeight || viewportHeight;
            const itemsPerRow = Math.max(Math.ceil(viewportWidth / defaultChildWidth), 1);
            const itemsPerCol = Math.max(Math.ceil(viewportHeight / defaultChildHeight), 1);
            wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
        }
        else {
            let scrollOffset = scrollElement[this._scrollType] - (this.previousViewPort ? this.previousViewPort.padding : 0);
            let arrayStartIndex = this.previousViewPort.startIndexWithBuffer || 0;
            let wrapGroupIndex = Math.ceil(arrayStartIndex / itemsPerWrapGroup);
            let maxWidthForWrapGroup = 0;
            let maxHeightForWrapGroup = 0;
            let sumOfVisibleMaxWidths = 0;
            let sumOfVisibleMaxHeights = 0;
            wrapGroupsPerPage = 0;
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < content.children.length; ++i) {
                ++arrayStartIndex;
                const child = content.children[i];
                const clientRect = this.getElementSize(child);
                maxWidthForWrapGroup = Math.max(maxWidthForWrapGroup, clientRect.width);
                maxHeightForWrapGroup = Math.max(maxHeightForWrapGroup, clientRect.height);
                if (arrayStartIndex % itemsPerWrapGroup === 0) {
                    const oldValue = this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
                    if (oldValue) {
                        --this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= oldValue.childWidth || 0;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= oldValue.childHeight || 0;
                    }
                    ++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                    const items = this.items.slice(arrayStartIndex - itemsPerWrapGroup, arrayStartIndex);
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = {
                        childWidth: maxWidthForWrapGroup,
                        childHeight: maxHeightForWrapGroup,
                        items
                    };
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += maxWidthForWrapGroup;
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += maxHeightForWrapGroup;
                    if (this.horizontal) {
                        let maxVisibleWidthForWrapGroup = Math.min(maxWidthForWrapGroup, Math.max(viewportWidth - sumOfVisibleMaxWidths, 0));
                        if (scrollOffset > 0) {
                            const scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleWidthForWrapGroup);
                            maxVisibleWidthForWrapGroup -= scrollOffsetToRemove;
                            scrollOffset -= scrollOffsetToRemove;
                        }
                        sumOfVisibleMaxWidths += maxVisibleWidthForWrapGroup;
                        if (maxVisibleWidthForWrapGroup > 0 && viewportWidth >= sumOfVisibleMaxWidths) {
                            ++wrapGroupsPerPage;
                        }
                    }
                    else {
                        let maxVisibleHeightForWrapGroup = Math.min(maxHeightForWrapGroup, Math.max(viewportHeight - sumOfVisibleMaxHeights, 0));
                        if (scrollOffset > 0) {
                            const scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleHeightForWrapGroup);
                            maxVisibleHeightForWrapGroup -= scrollOffsetToRemove;
                            scrollOffset -= scrollOffsetToRemove;
                        }
                        sumOfVisibleMaxHeights += maxVisibleHeightForWrapGroup;
                        if (maxVisibleHeightForWrapGroup > 0 && viewportHeight >= sumOfVisibleMaxHeights) {
                            ++wrapGroupsPerPage;
                        }
                    }
                    ++wrapGroupIndex;
                    maxWidthForWrapGroup = 0;
                    maxHeightForWrapGroup = 0;
                }
            }
            const averageChildWidth = this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths /
                this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
            const averageChildHeight = this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights /
                this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
            defaultChildWidth = this.childWidth || averageChildWidth || viewportWidth;
            defaultChildHeight = this.childHeight || averageChildHeight || viewportHeight;
            if (this.horizontal) {
                if (viewportWidth > sumOfVisibleMaxWidths) {
                    wrapGroupsPerPage += Math.ceil((viewportWidth - sumOfVisibleMaxWidths) / defaultChildWidth);
                }
            }
            else {
                if (viewportHeight > sumOfVisibleMaxHeights) {
                    wrapGroupsPerPage += Math.ceil((viewportHeight - sumOfVisibleMaxHeights) / defaultChildHeight);
                }
            }
        }
        const itemCount = this.items.length;
        const itemsPerPage = itemsPerWrapGroup * wrapGroupsPerPage;
        const pageCountFractional = itemCount / itemsPerPage;
        const numberOfWrapGroups = Math.ceil(itemCount / itemsPerWrapGroup);
        let scrollLength = 0;
        const defaultScrollLengthPerWrapGroup = this.horizontal ? defaultChildWidth : defaultChildHeight;
        if (this.enableUnequalChildrenSizes) {
            let numUnknownChildSizes = 0;
            for (let i = 0; i < numberOfWrapGroups; ++i) {
                const childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
                if (childSize) {
                    scrollLength += childSize;
                }
                else {
                    ++numUnknownChildSizes;
                }
            }
            scrollLength += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);
        }
        else {
            scrollLength = numberOfWrapGroups * defaultScrollLengthPerWrapGroup;
        }
        if (this.headerElementRef) {
            scrollLength += this.headerElementRef.nativeElement.clientHeight;
        }
        const viewportLength = this.horizontal ? viewportWidth : viewportHeight;
        const maxScrollPosition = Math.max(scrollLength - viewportLength, 0);
        return {
            childHeight: defaultChildHeight,
            childWidth: defaultChildWidth,
            itemCount,
            itemsPerPage,
            itemsPerWrapGroup,
            maxScrollPosition,
            pageCount_fractional: pageCountFractional,
            scrollLength,
            viewportLength,
            wrapGroupsPerPage,
        };
    }
    calculatePadding(arrayStartIndexWithBuffer, dimensions) {
        if (dimensions.itemCount === 0) {
            return 0;
        }
        const defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
        const startingWrapGroupIndex = Math.floor(arrayStartIndexWithBuffer / dimensions.itemsPerWrapGroup) || 0;
        if (!this.enableUnequalChildrenSizes) {
            return defaultScrollLengthPerWrapGroup * startingWrapGroupIndex;
        }
        let numUnknownChildSizes = 0;
        let result = 0;
        for (let i = 0; i < startingWrapGroupIndex; ++i) {
            const childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
            if (childSize) {
                result += childSize;
            }
            else {
                ++numUnknownChildSizes;
            }
        }
        result += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);
        return result;
    }
    calculatePageInfo(scrollPosition, dimensions) {
        let scrollPercentage = 0;
        if (this.enableUnequalChildrenSizes) {
            const numberOfWrapGroups = Math.ceil(dimensions.itemCount / dimensions.itemsPerWrapGroup);
            let totalScrolledLength = 0;
            const defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
            for (let i = 0; i < numberOfWrapGroups; ++i) {
                const childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
                if (childSize) {
                    totalScrolledLength += childSize;
                }
                else {
                    totalScrolledLength += defaultScrollLengthPerWrapGroup;
                }
                if (scrollPosition < totalScrolledLength) {
                    scrollPercentage = i / numberOfWrapGroups;
                    break;
                }
            }
        }
        else {
            scrollPercentage = scrollPosition / dimensions.scrollLength;
        }
        const startingArrayIndexFractional = Math.min(Math.max(scrollPercentage * dimensions.pageCount_fractional, 0), dimensions.pageCount_fractional) * dimensions.itemsPerPage;
        const maxStart = dimensions.itemCount - dimensions.itemsPerPage - 1;
        let arrayStartIndex = Math.min(Math.floor(startingArrayIndexFractional), maxStart);
        arrayStartIndex -= arrayStartIndex % dimensions.itemsPerWrapGroup; // round down to start of wrapGroup
        if (this.stripedTable) {
            const bufferBoundary = 2 * dimensions.itemsPerWrapGroup;
            if (arrayStartIndex % bufferBoundary !== 0) {
                arrayStartIndex = Math.max(arrayStartIndex - arrayStartIndex % bufferBoundary, 0);
            }
        }
        let arrayEndIndex = Math.ceil(startingArrayIndexFractional) + dimensions.itemsPerPage - 1;
        const endIndexWithinWrapGroup = (arrayEndIndex + 1) % dimensions.itemsPerWrapGroup;
        if (endIndexWithinWrapGroup > 0) {
            arrayEndIndex += dimensions.itemsPerWrapGroup - endIndexWithinWrapGroup; // round up to end of wrapGroup
        }
        if (isNaN(arrayStartIndex)) {
            arrayStartIndex = 0;
        }
        if (isNaN(arrayEndIndex)) {
            arrayEndIndex = 0;
        }
        arrayStartIndex = Math.min(Math.max(arrayStartIndex, 0), dimensions.itemCount - 1);
        arrayEndIndex = Math.min(Math.max(arrayEndIndex, 0), dimensions.itemCount - 1);
        const bufferSize = this.bufferAmount * dimensions.itemsPerWrapGroup;
        const startIndexWithBuffer = Math.min(Math.max(arrayStartIndex - bufferSize, 0), dimensions.itemCount - 1);
        const endIndexWithBuffer = Math.min(Math.max(arrayEndIndex + bufferSize, 0), dimensions.itemCount - 1);
        return {
            startIndex: arrayStartIndex,
            endIndex: arrayEndIndex,
            startIndexWithBuffer,
            endIndexWithBuffer,
            scrollStartPosition: scrollPosition,
            scrollEndPosition: scrollPosition + dimensions.viewportLength,
            maxScrollPosition: dimensions.maxScrollPosition
        };
    }
    calculateViewport() {
        const dimensions = this.calculateDimensions();
        const offset = this.getElementsOffset();
        let scrollStartPosition = this.getScrollStartPosition();
        if (scrollStartPosition > (dimensions.scrollLength + offset) && !(this.parentScroll instanceof Window)) {
            scrollStartPosition = dimensions.scrollLength;
        }
        else {
            scrollStartPosition -= offset;
        }
        scrollStartPosition = Math.max(0, scrollStartPosition);
        const pageInfo = this.calculatePageInfo(scrollStartPosition, dimensions);
        const newPadding = this.calculatePadding(pageInfo.startIndexWithBuffer, dimensions);
        const newScrollLength = dimensions.scrollLength;
        return {
            startIndex: pageInfo.startIndex,
            endIndex: pageInfo.endIndex,
            startIndexWithBuffer: pageInfo.startIndexWithBuffer,
            endIndexWithBuffer: pageInfo.endIndexWithBuffer,
            padding: Math.round(newPadding),
            scrollLength: Math.round(newScrollLength),
            scrollStartPosition: pageInfo.scrollStartPosition,
            scrollEndPosition: pageInfo.scrollEndPosition,
            maxScrollPosition: pageInfo.maxScrollPosition
        };
    }
};
VirtualScrollerComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: Renderer2 },
    { type: NgZone },
    { type: ChangeDetectorRef },
    { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: ['virtual-scroller-default-options',] }] }
];
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "enableUnequalChildrenSizes", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "bufferAmount", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "scrollThrottlingTime", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "scrollDebounceTime", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "checkResizeInterval", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "items", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "horizontal", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "parentScroll", null);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "executeRefreshOutsideAngularZone", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "RTL", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "useMarginInsteadOfTranslate", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "modifyOverflowStyleOfParentScroll", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "stripedTable", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "scrollbarWidth", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "scrollbarHeight", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "childWidth", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "childHeight", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "ssrChildWidth", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "ssrChildHeight", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "ssrViewportWidth", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "ssrViewportHeight", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "scrollAnimationTime", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "resizeBypassRefreshThreshold", void 0);
__decorate([
    Output()
], VirtualScrollerComponent.prototype, "vsUpdate", void 0);
__decorate([
    Output()
], VirtualScrollerComponent.prototype, "vsChange", void 0);
__decorate([
    Output()
], VirtualScrollerComponent.prototype, "vsStart", void 0);
__decorate([
    Output()
], VirtualScrollerComponent.prototype, "vsEnd", void 0);
__decorate([
    ViewChild('content', { read: ElementRef, static: true })
], VirtualScrollerComponent.prototype, "contentElementRef", void 0);
__decorate([
    ViewChild('invisiblePadding', { read: ElementRef, static: true })
], VirtualScrollerComponent.prototype, "invisiblePaddingElementRef", void 0);
__decorate([
    ContentChild('header', { read: ElementRef, static: false })
], VirtualScrollerComponent.prototype, "headerElementRef", void 0);
__decorate([
    ContentChild('container', { read: ElementRef, static: false })
], VirtualScrollerComponent.prototype, "containerElementRef", void 0);
__decorate([
    Input()
], VirtualScrollerComponent.prototype, "compareItems", void 0);
VirtualScrollerComponent = __decorate([
    Component({
        selector: 'virtual-scroller,[virtualScroller]',
        exportAs: 'virtualScroller',
        template: `
        <div class="total-padding" #invisiblePadding></div>
        <div class="scrollable-content" #content>
            <ng-content></ng-content>
        </div>
    `,
        host: {
            '[class.horizontal]': 'horizontal',
            '[class.vertical]': '!horizontal',
            '[class.selfScroll]': '!parentScroll',
            '[class.rtl]': 'RTL'
        },
        styles: [`
        :host {
            position: relative;
            display: block;
            -webkit-overflow-scrolling: touch;
        }

        :host.horizontal.selfScroll {
            overflow-y: visible;
            overflow-x: auto;
        }

        :host.horizontal.selfScroll.rtl {
            transform: scaleX(-1);
        }

        :host.vertical.selfScroll {
            overflow-y: auto;
            overflow-x: visible;
        }

        .scrollable-content {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            max-width: 100vw;
            max-height: 100vh;
            position: absolute;
        }

        .scrollable-content ::ng-deep > * {
            box-sizing: border-box;
        }

        :host.horizontal {
            white-space: nowrap;
        }

        :host.horizontal .scrollable-content {
            display: flex;
        }

        :host.horizontal .scrollable-content ::ng-deep > * {
            flex-shrink: 0;
            flex-grow: 0;
            white-space: initial;
        }

        :host.horizontal.rtl .scrollable-content ::ng-deep > * {
            transform: scaleX(-1);
        }

        .total-padding {
            position: absolute;
            top: 0;
            left: 0;
            height: 1px;
            width: 1px;
            transform-origin: 0 0;
            opacity: 0;
        }

        :host.horizontal .total-padding {
            height: 100%;
        }
    `]
    }),
    __param(4, Inject(PLATFORM_ID)),
    __param(5, Optional()), __param(5, Inject('virtual-scroller-default-options'))
], VirtualScrollerComponent);
export { VirtualScrollerComponent };
let VirtualScrollerModule = class VirtualScrollerModule {
};
VirtualScrollerModule = __decorate([
    NgModule({
        exports: [VirtualScrollerComponent],
        declarations: [VirtualScrollerComponent],
        imports: [CommonModule],
        providers: [
            {
                provide: 'virtual-scroller-default-options',
                useFactory: VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY
            }
        ]
    })
], VirtualScrollerModule);
export { VirtualScrollerModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC12aXJ0dWFsLXNjcm9sbGVyLyIsInNvdXJjZXMiOlsidmlydHVhbC1zY3JvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUNILGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsWUFBWSxFQUFFLE9BQU8sRUFDckIsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxNQUFNLEVBQ04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsU0FBUyxHQUNaLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFakQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTdDLE9BQU8sS0FBSyxLQUFLLE1BQU0sbUJBQW1CLENBQUE7QUFjMUMsTUFBTSxVQUFVLHdDQUF3QztJQUNwRCxPQUFPO1FBQ0gsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixpQ0FBaUMsRUFBRSxJQUFJO1FBQ3ZDLDRCQUE0QixFQUFFLENBQUM7UUFDL0IsbUJBQW1CLEVBQUUsR0FBRztRQUN4QixrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLG9CQUFvQixFQUFFLENBQUM7UUFDdkIsWUFBWSxFQUFFLEtBQUs7S0FDdEIsQ0FBQztBQUNOLENBQUM7QUE4SEQsSUFBYSx3QkFBd0IsR0FBckMsTUFBYSx3QkFBd0I7SUEySGpDLFlBQ3VCLE9BQW1CLEVBQ25CLFFBQW1CLEVBQ25CLElBQVksRUFDckIsaUJBQW9DO0lBQzlDLHFDQUFxQztJQUNoQixVQUFrQixFQUVuQyxPQUFzQztRQVB2QixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBQ25CLGFBQVEsR0FBUixRQUFR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RUFBRSxpQkFBaUI7UUFDM0IsUUFBUSxFQUFFOzs7OztLQUtUO1FBQ0QsSUFBSSxFQUFFO1lBQ0Ysb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxrQkFBa0IsRUFBRSxhQUFhO1lBQ2pDLG9CQUFvQixFQUFFLGVBQWU7WUFDckMsYUFBYSxFQUFFLEtBQUs7U0FDdkI7aUJBQ1E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQWtFUjtLQUNKLENBQUM7SUFrSU8sV0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDbkIsV0FBQSxRQUFRLEVBQUUsQ0FBQSxFQUFFLFdBQUEsTUFBTSxDQUFDLGtDQUFrQyxDQUFDLENBQUE7R0FsSWxELHdCQUF3QixDQXNyQ3BDO1NBdHJDWSx3QkFBd0I7QUFtc0NyQyxJQUFhLHFCQUFxQixHQUFsQyxNQUFhLHFCQUFxQjtDQUNqQyxDQUFBO0FBRFkscUJBQXFCO0lBWGpDLFFBQVEsQ0FBQztRQUNOLE9BQU8sRUFBRSxDQUFDLHdCQUF3QixDQUFDO1FBQ25DLFlBQVksRUFBRSxDQUFDLHdCQUF3QixDQUFDO1FBQ3hDLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQztRQUN2QixTQUFTLEVBQUU7WUFDUDtnQkFDSSxPQUFPLEVBQUUsa0NBQWtDO2dCQUMzQyxVQUFVLEVBQUUsd0NBQXdDO2FBQ3ZEO1NBQ0o7S0FDSixDQUFDO0dBQ1cscUJBQXFCLENBQ2pDO1NBRFkscUJBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBDb21wb25lbnQsXG4gICAgQ29udGVudENoaWxkLCBEb0NoZWNrLFxuICAgIEVsZW1lbnRSZWYsXG4gICAgRXZlbnRFbWl0dGVyLFxuICAgIEluamVjdCxcbiAgICBJbnB1dCxcbiAgICBOZ01vZHVsZSxcbiAgICBOZ1pvbmUsXG4gICAgT25DaGFuZ2VzLFxuICAgIE9uRGVzdHJveSxcbiAgICBPbkluaXQsXG4gICAgT3B0aW9uYWwsXG4gICAgT3V0cHV0LFxuICAgIFJlbmRlcmVyMixcbiAgICBWaWV3Q2hpbGQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1BMQVRGT1JNX0lEfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7aXNQbGF0Zm9ybVNlcnZlcn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuaW1wb3J0IHtDb21tb25Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCAqIGFzIHR3ZWVuIGZyb20gJ0B0d2VlbmpzL3R3ZWVuLmpzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFZpcnR1YWxTY3JvbGxlckRlZmF1bHRPcHRpb25zIHtcbiAgICBjaGVja1Jlc2l6ZUludGVydmFsOiBudW1iZXJcbiAgICBtb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGw6IGJvb2xlYW4sXG4gICAgcmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDogbnVtYmVyLFxuICAgIHNjcm9sbEFuaW1hdGlvblRpbWU6IG51bWJlcjtcbiAgICBzY3JvbGxEZWJvdW5jZVRpbWU6IG51bWJlcjtcbiAgICBzY3JvbGxUaHJvdHRsaW5nVGltZTogbnVtYmVyO1xuICAgIHNjcm9sbGJhckhlaWdodD86IG51bWJlcjtcbiAgICBzY3JvbGxiYXJXaWR0aD86IG51bWJlcjtcbiAgICBzdHJpcGVkVGFibGU6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFZJUlRVQUxfU0NST0xMRVJfREVGQVVMVF9PUFRJT05TX0ZBQ1RPUlkoKTogVmlydHVhbFNjcm9sbGVyRGVmYXVsdE9wdGlvbnMge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNoZWNrUmVzaXplSW50ZXJ2YWw6IDEwMDAsXG4gICAgICAgIG1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbDogdHJ1ZSxcbiAgICAgICAgcmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDogNSxcbiAgICAgICAgc2Nyb2xsQW5pbWF0aW9uVGltZTogNzUwLFxuICAgICAgICBzY3JvbGxEZWJvdW5jZVRpbWU6IDAsXG4gICAgICAgIHNjcm9sbFRocm90dGxpbmdUaW1lOiAwLFxuICAgICAgICBzdHJpcGVkVGFibGU6IGZhbHNlXG4gICAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBXcmFwR3JvdXBEaW1lbnNpb25zIHtcbiAgICBtYXhDaGlsZFNpemVQZXJXcmFwR3JvdXA6IFdyYXBHcm91cERpbWVuc2lvbltdO1xuICAgIG51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzOiBudW1iZXI7XG4gICAgc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0czogbnVtYmVyO1xuICAgIHN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRoczogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdyYXBHcm91cERpbWVuc2lvbiB7XG4gICAgY2hpbGRIZWlnaHQ6IG51bWJlcjtcbiAgICBjaGlsZFdpZHRoOiBudW1iZXI7XG4gICAgaXRlbXM6IGFueVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEaW1lbnNpb25zIHtcbiAgICBjaGlsZEhlaWdodDogbnVtYmVyO1xuICAgIGNoaWxkV2lkdGg6IG51bWJlcjtcbiAgICBpdGVtQ291bnQ6IG51bWJlcjtcbiAgICBpdGVtc1BlclBhZ2U6IG51bWJlcjtcbiAgICBpdGVtc1BlcldyYXBHcm91cDogbnVtYmVyO1xuICAgIG1heFNjcm9sbFBvc2l0aW9uOiBudW1iZXI7XG4gICAgcGFnZUNvdW50X2ZyYWN0aW9uYWw6IG51bWJlcjtcbiAgICBzY3JvbGxMZW5ndGg6IG51bWJlcjtcbiAgICB2aWV3cG9ydExlbmd0aDogbnVtYmVyO1xuICAgIHdyYXBHcm91cHNQZXJQYWdlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBhZ2VJbmZvIHtcbiAgICBlbmRJbmRleDogbnVtYmVyO1xuICAgIGVuZEluZGV4V2l0aEJ1ZmZlcjogbnVtYmVyO1xuICAgIG1heFNjcm9sbFBvc2l0aW9uOiBudW1iZXI7XG4gICAgc2Nyb2xsRW5kUG9zaXRpb246IG51bWJlcjtcbiAgICBzY3JvbGxTdGFydFBvc2l0aW9uOiBudW1iZXI7XG4gICAgc3RhcnRJbmRleDogbnVtYmVyO1xuICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVZpZXdwb3J0IGV4dGVuZHMgSVBhZ2VJbmZvIHtcbiAgICBwYWRkaW5nOiBudW1iZXI7XG4gICAgc2Nyb2xsTGVuZ3RoOiBudW1iZXI7XG59XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAndmlydHVhbC1zY3JvbGxlcixbdmlydHVhbFNjcm9sbGVyXScsXG4gICAgZXhwb3J0QXM6ICd2aXJ0dWFsU2Nyb2xsZXInLFxuICAgIHRlbXBsYXRlOiBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ0b3RhbC1wYWRkaW5nXCIgI2ludmlzaWJsZVBhZGRpbmc+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGxhYmxlLWNvbnRlbnRcIiAjY29udGVudD5cbiAgICAgICAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAgICAgICAgPC9kaXY+XG4gICAgYCxcbiAgICBob3N0OiB7XG4gICAgICAgICdbY2xhc3MuaG9yaXpvbnRhbF0nOiAnaG9yaXpvbnRhbCcsXG4gICAgICAgICdbY2xhc3MudmVydGljYWxdJzogJyFob3Jpem9udGFsJyxcbiAgICAgICAgJ1tjbGFzcy5zZWxmU2Nyb2xsXSc6ICchcGFyZW50U2Nyb2xsJyxcbiAgICAgICAgJ1tjbGFzcy5ydGxdJzogJ1JUTCdcbiAgICB9LFxuICAgIHN0eWxlczogW2BcbiAgICAgICAgOmhvc3Qge1xuICAgICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsLnNlbGZTY3JvbGwge1xuICAgICAgICAgICAgb3ZlcmZsb3cteTogdmlzaWJsZTtcbiAgICAgICAgICAgIG92ZXJmbG93LXg6IGF1dG87XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsLnNlbGZTY3JvbGwucnRsIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGVYKC0xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0LnZlcnRpY2FsLnNlbGZTY3JvbGwge1xuICAgICAgICAgICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICAgICAgICAgIG92ZXJmbG93LXg6IHZpc2libGU7XG4gICAgICAgIH1cblxuICAgICAgICAuc2Nyb2xsYWJsZS1jb250ZW50IHtcbiAgICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICAgIG1heC13aWR0aDogMTAwdnc7XG4gICAgICAgICAgICBtYXgtaGVpZ2h0OiAxMDB2aDtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zY3JvbGxhYmxlLWNvbnRlbnQgOjpuZy1kZWVwID4gKiB7XG4gICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbCB7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbCAuc2Nyb2xsYWJsZS1jb250ZW50IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsIC5zY3JvbGxhYmxlLWNvbnRlbnQgOjpuZy1kZWVwID4gKiB7XG4gICAgICAgICAgICBmbGV4LXNocmluazogMDtcbiAgICAgICAgICAgIGZsZXgtZ3JvdzogMDtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBpbml0aWFsO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbC5ydGwgLnNjcm9sbGFibGUtY29udGVudCA6Om5nLWRlZXAgPiAqIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGVYKC0xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC50b3RhbC1wYWRkaW5nIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgICBoZWlnaHQ6IDFweDtcbiAgICAgICAgICAgIHdpZHRoOiAxcHg7XG4gICAgICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiAwIDA7XG4gICAgICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbCAudG90YWwtcGFkZGluZyB7XG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIH1cbiAgICBgXVxufSlcbmV4cG9ydCBjbGFzcyBWaXJ0dWFsU2Nyb2xsZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBEb0NoZWNrIHtcblxuICAgIHB1YmxpYyBnZXQgdmlld1BvcnRJbmZvKCk6IElQYWdlSW5mbyB7XG4gICAgICAgIGNvbnN0IHBhZ2VJbmZvOiBJVmlld3BvcnQgPSB0aGlzLnByZXZpb3VzVmlld1BvcnQgfHwgKHt9IGFzIGFueSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydEluZGV4OiBwYWdlSW5mby5zdGFydEluZGV4IHx8IDAsXG4gICAgICAgICAgICBlbmRJbmRleDogcGFnZUluZm8uZW5kSW5kZXggfHwgMCxcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb246IHBhZ2VJbmZvLnNjcm9sbFN0YXJ0UG9zaXRpb24gfHwgMCxcbiAgICAgICAgICAgIHNjcm9sbEVuZFBvc2l0aW9uOiBwYWdlSW5mby5zY3JvbGxFbmRQb3NpdGlvbiB8fCAwLFxuICAgICAgICAgICAgbWF4U2Nyb2xsUG9zaXRpb246IHBhZ2VJbmZvLm1heFNjcm9sbFBvc2l0aW9uIHx8IDAsXG4gICAgICAgICAgICBzdGFydEluZGV4V2l0aEJ1ZmZlcjogcGFnZUluZm8uc3RhcnRJbmRleFdpdGhCdWZmZXIgfHwgMCxcbiAgICAgICAgICAgIGVuZEluZGV4V2l0aEJ1ZmZlcjogcGFnZUluZm8uZW5kSW5kZXhXaXRoQnVmZmVyIHx8IDBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2VuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzID0gdmFsdWU7XG4gICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IGJ1ZmZlckFtb3VudCgpOiBudW1iZXIge1xuICAgICAgICBpZiAodHlwZW9mICh0aGlzLl9idWZmZXJBbW91bnQpID09PSAnbnVtYmVyJyAmJiB0aGlzLl9idWZmZXJBbW91bnQgPj0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2J1ZmZlckFtb3VudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzID8gNSA6IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGJ1ZmZlckFtb3VudCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX2J1ZmZlckFtb3VudCA9IHZhbHVlO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBzY3JvbGxUaHJvdHRsaW5nVGltZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Nyb2xsVGhyb3R0bGluZ1RpbWU7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBzY3JvbGxUaHJvdHRsaW5nVGltZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbFRocm90dGxpbmdUaW1lID0gdmFsdWU7XG4gICAgICAgIHRoaXMudXBkYXRlT25TY3JvbGxGdW5jdGlvbigpO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBzY3JvbGxEZWJvdW5jZVRpbWUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Njcm9sbERlYm91bmNlVGltZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHNjcm9sbERlYm91bmNlVGltZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbERlYm91bmNlVGltZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnVwZGF0ZU9uU2Nyb2xsRnVuY3Rpb24oKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgY2hlY2tSZXNpemVJbnRlcnZhbCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGNoZWNrUmVzaXplSW50ZXJ2YWwodmFsdWU6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NoZWNrUmVzaXplSW50ZXJ2YWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5hZGRTY3JvbGxFdmVudEhhbmRsZXJzKCk7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IGl0ZW1zKCk6IGFueVtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZW1zO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgaXRlbXModmFsdWU6IGFueVtdKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdGhpcy5faXRlbXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2l0ZW1zID0gdmFsdWUgfHwgW107XG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbCh0cnVlKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgaG9yaXpvbnRhbCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hvcml6b250YWw7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBob3Jpem9udGFsKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX2hvcml6b250YWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy51cGRhdGVEaXJlY3Rpb24oKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgcGFyZW50U2Nyb2xsKCk6IEVsZW1lbnQgfCBXaW5kb3cge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50U2Nyb2xsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgcGFyZW50U2Nyb2xsKHZhbHVlOiBFbGVtZW50IHwgV2luZG93KSB7XG4gICAgICAgIGlmICh0aGlzLl9wYXJlbnRTY3JvbGwgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJldmVydFBhcmVudE92ZXJzY3JvbGwoKTtcbiAgICAgICAgdGhpcy5fcGFyZW50U2Nyb2xsID0gdmFsdWU7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuXG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKHRoaXMubW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsICYmIHNjcm9sbEVsZW1lbnQgIT09IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLm9sZFBhcmVudFNjcm9sbE92ZXJmbG93ID0ge3g6IHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXgnXSwgeTogc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteSddfTtcbiAgICAgICAgICAgIHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXknXSA9IHRoaXMuaG9yaXpvbnRhbCA/ICd2aXNpYmxlJyA6ICdhdXRvJztcbiAgICAgICAgICAgIHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXgnXSA9IHRoaXMuaG9yaXpvbnRhbCA/ICdhdXRvJyA6ICd2aXNpYmxlJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgZWxlbWVudDogRWxlbWVudFJlZixcbiAgICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IHJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgICAgIHByb3RlY3RlZCByZWFkb25seSB6b25lOiBOZ1pvbmUsXG4gICAgICAgIHByb3RlY3RlZCBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpiYW4tdHlwZXNcbiAgICAgICAgQEluamVjdChQTEFURk9STV9JRCkgcGxhdGZvcm1JZDogT2JqZWN0LFxuICAgICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KCd2aXJ0dWFsLXNjcm9sbGVyLWRlZmF1bHQtb3B0aW9ucycpXG4gICAgICAgICAgICBvcHRpb25zOiBWaXJ0dWFsU2Nyb2xsZXJEZWZhdWx0T3B0aW9uc1xuICAgICkge1xuXG4gICAgICAgIHRoaXMuaXNBbmd1bGFyVW5pdmVyc2FsU1NSID0gaXNQbGF0Zm9ybVNlcnZlcihwbGF0Zm9ybUlkKTtcblxuICAgICAgICB0aGlzLmNoZWNrUmVzaXplSW50ZXJ2YWwgPSBvcHRpb25zLmNoZWNrUmVzaXplSW50ZXJ2YWw7XG4gICAgICAgIHRoaXMubW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsID0gb3B0aW9ucy5tb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGw7XG4gICAgICAgIHRoaXMucmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZCA9IG9wdGlvbnMucmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDtcbiAgICAgICAgdGhpcy5zY3JvbGxBbmltYXRpb25UaW1lID0gb3B0aW9ucy5zY3JvbGxBbmltYXRpb25UaW1lO1xuICAgICAgICB0aGlzLnNjcm9sbERlYm91bmNlVGltZSA9IG9wdGlvbnMuc2Nyb2xsRGVib3VuY2VUaW1lO1xuICAgICAgICB0aGlzLnNjcm9sbFRocm90dGxpbmdUaW1lID0gb3B0aW9ucy5zY3JvbGxUaHJvdHRsaW5nVGltZTtcbiAgICAgICAgdGhpcy5zY3JvbGxiYXJIZWlnaHQgPSBvcHRpb25zLnNjcm9sbGJhckhlaWdodDtcbiAgICAgICAgdGhpcy5zY3JvbGxiYXJXaWR0aCA9IG9wdGlvbnMuc2Nyb2xsYmFyV2lkdGg7XG4gICAgICAgIHRoaXMuc3RyaXBlZFRhYmxlID0gb3B0aW9ucy5zdHJpcGVkVGFibGU7XG5cbiAgICAgICAgdGhpcy5ob3Jpem9udGFsID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzZXRXcmFwR3JvdXBEaW1lbnNpb25zKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHZpZXdQb3J0SXRlbXM6IGFueVtdO1xuICAgIHB1YmxpYyB3aW5kb3cgPSB3aW5kb3c7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBleGVjdXRlUmVmcmVzaE91dHNpZGVBbmd1bGFyWm9uZSA9IGZhbHNlO1xuXG4gICAgcHJvdGVjdGVkIF9lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyA9IGZhbHNlO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgUlRMID0gZmFsc2U7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyB1c2VNYXJnaW5JbnN0ZWFkT2ZUcmFuc2xhdGUgPSBmYWxzZTtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIG1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbDogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHN0cmlwZWRUYWJsZTogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNjcm9sbGJhcldpZHRoOiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzY3JvbGxiYXJIZWlnaHQ6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGNoaWxkV2lkdGg6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGNoaWxkSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzc3JDaGlsZFdpZHRoOiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzc3JDaGlsZEhlaWdodDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc3NyVmlld3BvcnRXaWR0aCA9IDE5MjA7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzc3JWaWV3cG9ydEhlaWdodCA9IDEwODA7XG5cbiAgICBwcm90ZWN0ZWQgX2J1ZmZlckFtb3VudDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc2Nyb2xsQW5pbWF0aW9uVGltZTogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgcmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIF9zY3JvbGxUaHJvdHRsaW5nVGltZTogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIF9zY3JvbGxEZWJvdW5jZVRpbWU6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCBvblNjcm9sbDogKCkgPT4gdm9pZDtcblxuICAgIHByb3RlY3RlZCBjaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkVGltZXI6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgX2NoZWNrUmVzaXplSW50ZXJ2YWw6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCBfaXRlbXM6IGFueVtdID0gW107XG5cbiAgICBwcm90ZWN0ZWQgX2hvcml6b250YWw6IGJvb2xlYW47XG5cbiAgICBwcm90ZWN0ZWQgb2xkUGFyZW50U2Nyb2xsT3ZlcmZsb3c6IHsgeDogc3RyaW5nLCB5OiBzdHJpbmcgfTtcbiAgICBwcm90ZWN0ZWQgX3BhcmVudFNjcm9sbDogRWxlbWVudCB8IFdpbmRvdztcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyB2c1VwZGF0ZTogRXZlbnRFbWl0dGVyPGFueVtdPiA9IG5ldyBFdmVudEVtaXR0ZXI8YW55W10+KCk7XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgdnNDaGFuZ2U6IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+KCk7XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgdnNTdGFydDogRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4gPSBuZXcgRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4oKTtcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyB2c0VuZDogRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4gPSBuZXcgRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4oKTtcblxuICAgIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnLCB7cmVhZDogRWxlbWVudFJlZiwgc3RhdGljOiB0cnVlfSlcbiAgICBwcm90ZWN0ZWQgY29udGVudEVsZW1lbnRSZWY6IEVsZW1lbnRSZWY7XG5cbiAgICBAVmlld0NoaWxkKCdpbnZpc2libGVQYWRkaW5nJywge3JlYWQ6IEVsZW1lbnRSZWYsIHN0YXRpYzogdHJ1ZX0pXG4gICAgcHJvdGVjdGVkIGludmlzaWJsZVBhZGRpbmdFbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gICAgQENvbnRlbnRDaGlsZCgnaGVhZGVyJywge3JlYWQ6IEVsZW1lbnRSZWYsIHN0YXRpYzogZmFsc2V9KVxuICAgIHByb3RlY3RlZCBoZWFkZXJFbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gICAgQENvbnRlbnRDaGlsZCgnY29udGFpbmVyJywge3JlYWQ6IEVsZW1lbnRSZWYsIHN0YXRpYzogZmFsc2V9KVxuICAgIHByb3RlY3RlZCBjb250YWluZXJFbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gICAgcHJvdGVjdGVkIGlzQW5ndWxhclVuaXZlcnNhbFNTUjogYm9vbGVhbjtcblxuICAgIHByb3RlY3RlZCBwcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdDogQ2xpZW50UmVjdDtcblxuICAgIHByb3RlY3RlZCBfaW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5O1xuICAgIHByb3RlY3RlZCBfb2Zmc2V0VHlwZTtcbiAgICBwcm90ZWN0ZWQgX3Njcm9sbFR5cGU7XG4gICAgcHJvdGVjdGVkIF9wYWdlT2Zmc2V0VHlwZTtcbiAgICBwcm90ZWN0ZWQgX2NoaWxkU2Nyb2xsRGltO1xuICAgIHByb3RlY3RlZCBfdHJhbnNsYXRlRGlyO1xuICAgIHByb3RlY3RlZCBfbWFyZ2luRGlyO1xuXG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZWRTY3JvbGxiYXJXaWR0aCA9IDA7XG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZWRTY3JvbGxiYXJIZWlnaHQgPSAwO1xuXG4gICAgcHJvdGVjdGVkIHBhZGRpbmcgPSAwO1xuICAgIHByb3RlY3RlZCBwcmV2aW91c1ZpZXdQb3J0OiBJVmlld3BvcnQgPSB7fSBhcyBhbnk7XG4gICAgcHJvdGVjdGVkIGN1cnJlbnRUd2VlbjogdHdlZW4uVHdlZW47XG4gICAgcHJvdGVjdGVkIGNhY2hlZEl0ZW1zTGVuZ3RoOiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgZGlzcG9zZVNjcm9sbEhhbmRsZXI6ICgpID0+IHZvaWQgfCB1bmRlZmluZWQ7XG4gICAgcHJvdGVjdGVkIGRpc3Bvc2VSZXNpemVIYW5kbGVyOiAoKSA9PiB2b2lkIHwgdW5kZWZpbmVkO1xuXG4gICAgcHJvdGVjdGVkIG1pbk1lYXN1cmVkQ2hpbGRXaWR0aDogbnVtYmVyO1xuICAgIHByb3RlY3RlZCBtaW5NZWFzdXJlZENoaWxkSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgd3JhcEdyb3VwRGltZW5zaW9uczogV3JhcEdyb3VwRGltZW5zaW9ucztcblxuICAgIHByb3RlY3RlZCBjYWNoZWRQYWdlU2l6ZSA9IDA7XG4gICAgcHJvdGVjdGVkIHByZXZpb3VzU2Nyb2xsTnVtYmVyRWxlbWVudHMgPSAwO1xuXG4gICAgcHJvdGVjdGVkIHVwZGF0ZU9uU2Nyb2xsRnVuY3Rpb24oKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbERlYm91bmNlVGltZSkge1xuICAgICAgICAgICAgdGhpcy5vblNjcm9sbCA9ICh0aGlzLmRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfSwgdGhpcy5zY3JvbGxEZWJvdW5jZVRpbWUpIGFzIGFueSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zY3JvbGxUaHJvdHRsaW5nVGltZSkge1xuICAgICAgICAgICAgdGhpcy5vblNjcm9sbCA9ICh0aGlzLnRocm90dGxlVHJhaWxpbmcoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgICAgICAgICB9LCB0aGlzLnNjcm9sbFRocm90dGxpbmdUaW1lKSBhcyBhbnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vblNjcm9sbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGNvbXBhcmVJdGVtczogKGl0ZW0xOiBhbnksIGl0ZW0yOiBhbnkpID0+IGJvb2xlYW4gPSAoaXRlbTE6IGFueSwgaXRlbTI6IGFueSkgPT4gaXRlbTEgPT09IGl0ZW0yO1xuXG4gICAgcHJvdGVjdGVkIHJldmVydFBhcmVudE92ZXJzY3JvbGwoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKHNjcm9sbEVsZW1lbnQgJiYgdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdykge1xuICAgICAgICAgICAgc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteSddID0gdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdy55O1xuICAgICAgICAgICAgc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteCddID0gdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdy54O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxFdmVudEhhbmRsZXJzKCk7XG4gICAgICAgIHRoaXMucmV2ZXJ0UGFyZW50T3ZlcnNjcm9sbCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaW5kZXhMZW5ndGhDaGFuZ2VkID0gdGhpcy5jYWNoZWRJdGVtc0xlbmd0aCAhPT0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIHRoaXMuY2FjaGVkSXRlbXNMZW5ndGggPSB0aGlzLml0ZW1zLmxlbmd0aDtcblxuICAgICAgICBjb25zdCBmaXJzdFJ1bjogYm9vbGVhbiA9ICFjaGFuZ2VzLml0ZW1zIHx8ICFjaGFuZ2VzLml0ZW1zLnByZXZpb3VzVmFsdWUgfHwgY2hhbmdlcy5pdGVtcy5wcmV2aW91c1ZhbHVlLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGluZGV4TGVuZ3RoQ2hhbmdlZCB8fCBmaXJzdFJ1bik7XG4gICAgfVxuXG4gICAgcHVibGljIG5nRG9DaGVjaygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVkSXRlbXNMZW5ndGggIT09IHRoaXMuaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmNhY2hlZEl0ZW1zTGVuZ3RoID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwodHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcmV2aW91c1ZpZXdQb3J0ICYmIHRoaXMudmlld1BvcnRJdGVtcyAmJiB0aGlzLnZpZXdQb3J0SXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IGl0ZW1zQXJyYXlDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudmlld1BvcnRJdGVtcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jb21wYXJlSXRlbXModGhpcy5pdGVtc1t0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXIgKyBpXSwgdGhpcy52aWV3UG9ydEl0ZW1zW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtc0FycmF5Q2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtc0FycmF5Q2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZWZyZXNoKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwodHJ1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGludmFsaWRhdGVBbGxDYWNoZWRNZWFzdXJlbWVudHMoKTogdm9pZCB7XG4gICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgIG1heENoaWxkU2l6ZVBlcldyYXBHcm91cDogW10sXG4gICAgICAgICAgICBudW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplczogMCxcbiAgICAgICAgICAgIHN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRoczogMCxcbiAgICAgICAgICAgIHN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHM6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGludmFsaWRhdGVDYWNoZWRNZWFzdXJlbWVudEZvckl0ZW0oaXRlbTogYW55KTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVDYWNoZWRNZWFzdXJlbWVudEF0SW5kZXgoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbnZhbGlkYXRlQ2FjaGVkTWVhc3VyZW1lbnRBdEluZGV4KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZE1lYXN1cmVtZW50ID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpbmRleF07XG4gICAgICAgICAgICBpZiAoY2FjaGVkTWVhc3VyZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2luZGV4XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAtLXRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzIC09IGNhY2hlZE1lYXN1cmVtZW50LmNoaWxkV2lkdGggfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0cyAtPSBjYWNoZWRNZWFzdXJlbWVudC5jaGlsZEhlaWdodCB8fCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzY3JvbGxJbnRvKGl0ZW06IGFueSwgYWxpZ25Ub0JlZ2lubmluZzogYm9vbGVhbiA9IHRydWUsIGFkZGl0aW9uYWxPZmZzZXQ6IG51bWJlciA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uTWlsbGlzZWNvbmRzPzogbnVtYmVyLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaW5kZXg6IG51bWJlciA9IHRoaXMuaXRlbXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zY3JvbGxUb0luZGV4KGluZGV4LCBhbGlnblRvQmVnaW5uaW5nLCBhZGRpdGlvbmFsT2Zmc2V0LCBhbmltYXRpb25NaWxsaXNlY29uZHMsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCBhbGlnblRvQmVnaW5uaW5nOiBib29sZWFuID0gdHJ1ZSwgYWRkaXRpb25hbE9mZnNldDogbnVtYmVyID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHM/OiBudW1iZXIsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBsZXQgbWF4UmV0cmllcyA9IDU7XG5cbiAgICAgICAgY29uc3QgcmV0cnlJZk5lZWRlZCA9ICgpID0+IHtcbiAgICAgICAgICAgIC0tbWF4UmV0cmllcztcbiAgICAgICAgICAgIGlmIChtYXhSZXRyaWVzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gdGhpcy5jYWxjdWxhdGVEaW1lbnNpb25zKCk7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3RhcnRJbmRleCA9IE1hdGgubWluKE1hdGgubWF4KGluZGV4LCAwKSwgZGltZW5zaW9ucy5pdGVtQ291bnQgLSAxKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleCA9PT0gZGVzaXJlZFN0YXJ0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvSW5kZXhfaW50ZXJuYWwoaW5kZXgsIGFsaWduVG9CZWdpbm5pbmcsIGFkZGl0aW9uYWxPZmZzZXQsIDAsIHJldHJ5SWZOZWVkZWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9JbmRleF9pbnRlcm5hbChpbmRleCwgYWxpZ25Ub0JlZ2lubmluZywgYWRkaXRpb25hbE9mZnNldCwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzLCByZXRyeUlmTmVlZGVkKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2Nyb2xsVG9JbmRleF9pbnRlcm5hbChpbmRleDogbnVtYmVyLCBhbGlnblRvQmVnaW5uaW5nOiBib29sZWFuID0gdHJ1ZSwgYWRkaXRpb25hbE9mZnNldDogbnVtYmVyID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHM/OiBudW1iZXIsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHMgPSBhbmltYXRpb25NaWxsaXNlY29uZHMgPT09IHVuZGVmaW5lZCA/IHRoaXMuc2Nyb2xsQW5pbWF0aW9uVGltZSA6IGFuaW1hdGlvbk1pbGxpc2Vjb25kcztcblxuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gdGhpcy5jYWxjdWxhdGVEaW1lbnNpb25zKCk7XG4gICAgICAgIGxldCBzY3JvbGwgPSB0aGlzLmNhbGN1bGF0ZVBhZGRpbmcoaW5kZXgsIGRpbWVuc2lvbnMpICsgYWRkaXRpb25hbE9mZnNldDtcbiAgICAgICAgaWYgKCFhbGlnblRvQmVnaW5uaW5nKSB7XG4gICAgICAgICAgICBzY3JvbGwgLT0gZGltZW5zaW9ucy53cmFwR3JvdXBzUGVyUGFnZSAqIGRpbWVuc2lvbnNbdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zY3JvbGxUb1Bvc2l0aW9uKHNjcm9sbCwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjayk7XG4gICAgfVxuXG4gICAgcHVibGljIHNjcm9sbFRvUG9zaXRpb24oc2Nyb2xsUG9zaXRpb246IG51bWJlciwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzPzogbnVtYmVyLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgc2Nyb2xsUG9zaXRpb24gKz0gdGhpcy5nZXRFbGVtZW50c09mZnNldCgpO1xuXG4gICAgICAgIGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9IGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9PT0gdW5kZWZpbmVkID8gdGhpcy5zY3JvbGxBbmltYXRpb25UaW1lIDogYW5pbWF0aW9uTWlsbGlzZWNvbmRzO1xuXG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcblxuICAgICAgICBsZXQgYW5pbWF0aW9uUmVxdWVzdDogbnVtYmVyO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRUd2Vlbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VHdlZW4uc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VHdlZW4gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFuaW1hdGlvbk1pbGxpc2Vjb25kcykge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eShzY3JvbGxFbGVtZW50LCB0aGlzLl9zY3JvbGxUeXBlLCBzY3JvbGxQb3NpdGlvbik7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHR3ZWVuQ29uZmlnT2JqID0ge3Njcm9sbFBvc2l0aW9uOiBzY3JvbGxFbGVtZW50W3RoaXMuX3Njcm9sbFR5cGVdfTtcblxuICAgICAgICBjb25zdCBuZXdUd2VlbiA9IG5ldyB0d2Vlbi5Ud2Vlbih0d2VlbkNvbmZpZ09iailcbiAgICAgICAgICAgIC50byh7c2Nyb2xsUG9zaXRpb259LCBhbmltYXRpb25NaWxsaXNlY29uZHMpXG4gICAgICAgICAgICAuZWFzaW5nKHR3ZWVuLkVhc2luZy5RdWFkcmF0aWMuT3V0KVxuICAgICAgICAgICAgLm9uVXBkYXRlKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKGRhdGEuc2Nyb2xsUG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eShzY3JvbGxFbGVtZW50LCB0aGlzLl9zY3JvbGxUeXBlLCBkYXRhLnNjcm9sbFBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vblN0b3AoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvblJlcXVlc3QpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFuaW1hdGUgPSAodGltZT86IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKCFuZXdUd2Vlbi5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmV3VHdlZW4udXBkYXRlKHRpbWUpO1xuICAgICAgICAgICAgaWYgKHR3ZWVuQ29uZmlnT2JqLnNjcm9sbFBvc2l0aW9uID09PSBzY3JvbGxQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSwgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25SZXF1ZXN0ID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgYW5pbWF0ZSgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUd2VlbiA9IG5ld1R3ZWVuO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRFbGVtZW50U2l6ZShlbGVtZW50OiBIVE1MRWxlbWVudCk6IENsaWVudFJlY3Qge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuICAgICAgICBjb25zdCBtYXJnaW5Ub3AgPSBwYXJzZUludChzdHlsZXNbJ21hcmdpbi10b3AnXSwgMTApIHx8IDA7XG4gICAgICAgIGNvbnN0IG1hcmdpbkJvdHRvbSA9IHBhcnNlSW50KHN0eWxlc1snbWFyZ2luLWJvdHRvbSddLCAxMCkgfHwgMDtcbiAgICAgICAgY29uc3QgbWFyZ2luTGVmdCA9IHBhcnNlSW50KHN0eWxlc1snbWFyZ2luLWxlZnQnXSwgMTApIHx8IDA7XG4gICAgICAgIGNvbnN0IG1hcmdpblJpZ2h0ID0gcGFyc2VJbnQoc3R5bGVzWydtYXJnaW4tcmlnaHQnXSwgMTApIHx8IDA7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogcmVzdWx0LnRvcCArIG1hcmdpblRvcCxcbiAgICAgICAgICAgIGJvdHRvbTogcmVzdWx0LmJvdHRvbSArIG1hcmdpbkJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQ6IHJlc3VsdC5sZWZ0ICsgbWFyZ2luTGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiByZXN1bHQucmlnaHQgKyBtYXJnaW5SaWdodCxcbiAgICAgICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGggKyBtYXJnaW5MZWZ0ICsgbWFyZ2luUmlnaHQsXG4gICAgICAgICAgICBoZWlnaHQ6IHJlc3VsdC5oZWlnaHQgKyBtYXJnaW5Ub3AgKyBtYXJnaW5Cb3R0b21cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYm91bmRpbmdSZWN0ID0gdGhpcy5nZXRFbGVtZW50U2l6ZSh0aGlzLmdldFNjcm9sbEVsZW1lbnQoKSk7XG5cbiAgICAgICAgbGV0IHNpemVDaGFuZ2VkOiBib29sZWFuO1xuICAgICAgICBpZiAoIXRoaXMucHJldmlvdXNTY3JvbGxCb3VuZGluZ1JlY3QpIHtcbiAgICAgICAgICAgIHNpemVDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoQ2hhbmdlID0gTWF0aC5hYnMoYm91bmRpbmdSZWN0LndpZHRoIC0gdGhpcy5wcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdC53aWR0aCk7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHRDaGFuZ2UgPSBNYXRoLmFicyhib3VuZGluZ1JlY3QuaGVpZ2h0IC0gdGhpcy5wcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdC5oZWlnaHQpO1xuICAgICAgICAgICAgc2l6ZUNoYW5nZWQgPSB3aWR0aENoYW5nZSA+IHRoaXMucmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZCB8fCBoZWlnaHRDaGFuZ2UgPiB0aGlzLnJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2l6ZUNoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNTY3JvbGxCb3VuZGluZ1JlY3QgPSBib3VuZGluZ1JlY3Q7XG4gICAgICAgICAgICBpZiAoYm91bmRpbmdSZWN0LndpZHRoID4gMCAmJiBib3VuZGluZ1JlY3QuaGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdXBkYXRlRGlyZWN0aW9uKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGlsZFNjcm9sbERpbSA9ICdjaGlsZFdpZHRoJztcbiAgICAgICAgICAgIHRoaXMuX2ludmlzaWJsZVBhZGRpbmdQcm9wZXJ0eSA9ICdzY2FsZVgnO1xuICAgICAgICAgICAgdGhpcy5fbWFyZ2luRGlyID0gJ21hcmdpbi1sZWZ0JztcbiAgICAgICAgICAgIHRoaXMuX29mZnNldFR5cGUgPSAnb2Zmc2V0TGVmdCc7XG4gICAgICAgICAgICB0aGlzLl9wYWdlT2Zmc2V0VHlwZSA9ICdwYWdlWE9mZnNldCc7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGxUeXBlID0gJ3Njcm9sbExlZnQnO1xuICAgICAgICAgICAgdGhpcy5fdHJhbnNsYXRlRGlyID0gJ3RyYW5zbGF0ZVgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY2hpbGRTY3JvbGxEaW0gPSAnY2hpbGRIZWlnaHQnO1xuICAgICAgICAgICAgdGhpcy5faW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5ID0gJ3NjYWxlWSc7XG4gICAgICAgICAgICB0aGlzLl9tYXJnaW5EaXIgPSAnbWFyZ2luLXRvcCc7XG4gICAgICAgICAgICB0aGlzLl9vZmZzZXRUeXBlID0gJ29mZnNldFRvcCc7XG4gICAgICAgICAgICB0aGlzLl9wYWdlT2Zmc2V0VHlwZSA9ICdwYWdlWU9mZnNldCc7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGxUeXBlID0gJ3Njcm9sbFRvcCc7XG4gICAgICAgICAgICB0aGlzLl90cmFuc2xhdGVEaXIgPSAndHJhbnNsYXRlWSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZGVib3VuY2UoZnVuYzogKCkgPT4gYW55LCB3YWl0OiBudW1iZXIpOiAoKSA9PiBhbnkge1xuICAgICAgICBjb25zdCB0aHJvdHRsZWQgPSB0aGlzLnRocm90dGxlVHJhaWxpbmcoZnVuYywgd2FpdCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICh0aHJvdHRsZWQgYXMgYW55KS5jYW5jZWwoKTtcbiAgICAgICAgICAgIHRocm90dGxlZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICByZXN1bHQuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgKHRocm90dGxlZCBhcyBhbnkpLmNhbmNlbCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHRocm90dGxlVHJhaWxpbmcoZnVuYzogKCkgPT4gYW55LCB3YWl0OiBudW1iZXIpOiAoKSA9PiBhbnkge1xuICAgICAgICBsZXQgdGltZW91dDtcbiAgICAgICAgbGV0IF9hcmd1bWVudHMgPSBhcmd1bWVudHM7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIF9hcmd1bWVudHMgPSBhcmd1bWVudHNcblxuICAgICAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3YWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KF90aGlzLCBfYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KF90aGlzLCBfYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9LCB3YWl0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVzdWx0LmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHRpbWVvdXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVmcmVzaF9pbnRlcm5hbChpdGVtc0FycmF5TW9kaWZpZWQ6IGJvb2xlYW4sIHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQsIG1heFJ1blRpbWVzOiBudW1iZXIgPSAyKTogdm9pZCB7XG4gICAgICAgIC8vIG5vdGU6IG1heFJ1blRpbWVzIGlzIHRvIGZvcmNlIGl0IHRvIGtlZXAgcmVjYWxjdWxhdGluZyBpZiB0aGUgcHJldmlvdXMgaXRlcmF0aW9uIGNhdXNlZCBhIHJlLXJlbmRlclxuICAgICAgICAvLyAgICAgICAoZGlmZmVyZW50IHNsaWNlZCBpdGVtcyBpbiB2aWV3cG9ydCBvciBzY3JvbGxQb3NpdGlvbiBjaGFuZ2VkKS5cbiAgICAgICAgLy8gVGhlIGRlZmF1bHQgb2YgMnggbWF4IHdpbGwgcHJvYmFibHkgYmUgYWNjdXJhdGUgZW5vdWdoIHdpdGhvdXQgY2F1c2luZyB0b28gbGFyZ2UgYSBwZXJmb3JtYW5jZSBib3R0bGVuZWNrXG4gICAgICAgIC8vIFRoZSBjb2RlIHdvdWxkIHR5cGljYWxseSBxdWl0IG91dCBvbiB0aGUgMm5kIGl0ZXJhdGlvbiBhbnl3YXlzLiBUaGUgbWFpbiB0aW1lIGl0J2QgdGhpbmsgbW9yZSB0aGFuIDIgcnVuc1xuICAgICAgICAvLyB3b3VsZCBiZSBuZWNlc3Nhcnkgd291bGQgYmUgZm9yIHZhc3RseSBkaWZmZXJlbnQgc2l6ZWQgY2hpbGQgaXRlbXMgb3IgaWYgdGhpcyBpcyB0aGUgMXN0IHRpbWUgdGhlIGl0ZW1zIGFycmF5XG4gICAgICAgIC8vIHdhcyBpbml0aWFsaXplZC5cbiAgICAgICAgLy8gV2l0aG91dCBtYXhSdW5UaW1lcywgSWYgdGhlIHVzZXIgaXMgYWN0aXZlbHkgc2Nyb2xsaW5nIHRoaXMgY29kZSB3b3VsZCBiZWNvbWUgYW4gaW5maW5pdGUgbG9vcCB1bnRpbCB0aGV5XG4gICAgICAgIC8vIHN0b3BwZWQgc2Nyb2xsaW5nLiBUaGlzIHdvdWxkIGJlIG9rYXksIGV4Y2VwdCBlYWNoIHNjcm9sbCBldmVudCB3b3VsZCBzdGFydCBhbiBhZGRpdGlvbmFsIGluZmluaXRlIGxvb3AuIFdlXG4gICAgICAgIC8vIHdhbnQgdG8gc2hvcnQtY2lyY3VpdCBpdCB0byBwcmV2ZW50IHRoaXMuXG5cbiAgICAgICAgaWYgKGl0ZW1zQXJyYXlNb2RpZmllZCAmJiB0aGlzLnByZXZpb3VzVmlld1BvcnQgJiYgdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbFN0YXJ0UG9zaXRpb24gPiAwKSB7XG4gICAgICAgICAgICAvLyBpZiBpdGVtcyB3ZXJlIHByZXBlbmRlZCwgc2Nyb2xsIGZvcndhcmQgdG8ga2VlcCBzYW1lIGl0ZW1zIHZpc2libGVcbiAgICAgICAgICAgIGNvbnN0IG9sZFZpZXdQb3J0ID0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0O1xuICAgICAgICAgICAgY29uc3Qgb2xkVmlld1BvcnRJdGVtcyA9IHRoaXMudmlld1BvcnRJdGVtcztcblxuXHRcdFx0Y29uc3Qgb2xkUmVmcmVzaENvbXBsZXRlZENhbGxiYWNrID0gcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrO1xuXHRcdFx0cmVmcmVzaENvbXBsZXRlZENhbGxiYWNrID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBzY3JvbGxMZW5ndGhEZWx0YSA9IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxMZW5ndGggLSBvbGRWaWV3UG9ydC5zY3JvbGxMZW5ndGg7XG5cdFx0XHRcdGlmIChzY3JvbGxMZW5ndGhEZWx0YSA+IDAgJiYgdGhpcy52aWV3UG9ydEl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4IC0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXhXaXRoQnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGFydEl0ZW0gPSBvbGRWaWV3UG9ydEl0ZW1zW29mZnNldF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXJ0SXRlbUluZGV4ID0gdGhpcy5pdGVtcy5maW5kSW5kZXgoeCA9PiB0aGlzLmNvbXBhcmVJdGVtcyhvbGRTdGFydEl0ZW0sIHgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob2xkU3RhcnRJdGVtSW5kZXggPiB0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW1PcmRlckNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxLCBsID0gdGhpcy52aWV3UG9ydEl0ZW1zLmxlbmd0aCAtIG9mZnNldDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5jb21wYXJlSXRlbXModGhpcy5pdGVtc1tvbGRTdGFydEl0ZW1JbmRleCArIGldLCBvbGRWaWV3UG9ydEl0ZW1zW29mZnNldCArIGldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtT3JkZXJDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW1PcmRlckNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvUG9zaXRpb24odGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbFN0YXJ0UG9zaXRpb24gKyBzY3JvbGxMZW5ndGhEZWx0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgb2xkUmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob2xkUmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZFJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtc0FycmF5TW9kaWZpZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNldFdyYXBHcm91cERpbWVuc2lvbnMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgdmlld3BvcnQgPSB0aGlzLmNhbGN1bGF0ZVZpZXdwb3J0KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydENoYW5nZWQgPSBpdGVtc0FycmF5TW9kaWZpZWQgfHwgdmlld3BvcnQuc3RhcnRJbmRleCAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXg7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kQ2hhbmdlZCA9IGl0ZW1zQXJyYXlNb2RpZmllZCB8fCB2aWV3cG9ydC5lbmRJbmRleCAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LmVuZEluZGV4O1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbExlbmd0aENoYW5nZWQgPSB2aWV3cG9ydC5zY3JvbGxMZW5ndGggIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFkZGluZ0NoYW5nZWQgPSB2aWV3cG9ydC5wYWRkaW5nICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQucGFkZGluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JvbGxQb3NpdGlvbkNoYW5nZWQgPSB2aWV3cG9ydC5zY3JvbGxTdGFydFBvc2l0aW9uICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc2Nyb2xsU3RhcnRQb3NpdGlvbiB8fFxuICAgICAgICAgICAgICAgICAgICB2aWV3cG9ydC5zY3JvbGxFbmRQb3NpdGlvbiAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbEVuZFBvc2l0aW9uIHx8XG4gICAgICAgICAgICAgICAgICAgIHZpZXdwb3J0Lm1heFNjcm9sbFBvc2l0aW9uICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQubWF4U2Nyb2xsUG9zaXRpb247XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzVmlld1BvcnQgPSB2aWV3cG9ydDtcblxuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxMZW5ndGhDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5pbnZpc2libGVQYWRkaW5nRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAndHJhbnNmb3JtJywgYCR7dGhpcy5faW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5fSgke3ZpZXdwb3J0LnNjcm9sbExlbmd0aH0pYCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5pbnZpc2libGVQYWRkaW5nRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2Via2l0VHJhbnNmb3JtJywgYCR7dGhpcy5faW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5fSgke3ZpZXdwb3J0LnNjcm9sbExlbmd0aH0pYCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHBhZGRpbmdDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnVzZU1hcmdpbkluc3RlYWRPZlRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmNvbnRlbnRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIHRoaXMuX21hcmdpbkRpciwgYCR7dmlld3BvcnQucGFkZGluZ31weGApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmNvbnRlbnRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd0cmFuc2Zvcm0nLCBgJHt0aGlzLl90cmFuc2xhdGVEaXJ9KCR7dmlld3BvcnQucGFkZGluZ31weClgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5jb250ZW50RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2Via2l0VHJhbnNmb3JtJywgYCR7dGhpcy5fdHJhbnNsYXRlRGlyfSgke3ZpZXdwb3J0LnBhZGRpbmd9cHgpYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oZWFkZXJFbGVtZW50UmVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KClbdGhpcy5fc2Nyb2xsVHlwZV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lck9mZnNldCA9IHRoaXMuZ2V0RWxlbWVudHNPZmZzZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gTWF0aC5tYXgoc2Nyb2xsUG9zaXRpb24gLSB2aWV3cG9ydC5wYWRkaW5nIC0gY29udGFpbmVyT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWVudEhlaWdodCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5oZWFkZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd0cmFuc2Zvcm0nLCBgJHt0aGlzLl90cmFuc2xhdGVEaXJ9KCR7b2Zmc2V0fXB4KWApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuaGVhZGVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2Via2l0VHJhbnNmb3JtJywgYCR7dGhpcy5fdHJhbnNsYXRlRGlyfSgke29mZnNldH1weClgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VFdmVudEFyZzogSVBhZ2VJbmZvID0gKHN0YXJ0Q2hhbmdlZCB8fCBlbmRDaGFuZ2VkKSA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleDogdmlld3BvcnQuc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXg6IHZpZXdwb3J0LmVuZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uOiB2aWV3cG9ydC5zY3JvbGxTdGFydFBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFbmRQb3NpdGlvbjogdmlld3BvcnQuc2Nyb2xsRW5kUG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyOiB2aWV3cG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXhXaXRoQnVmZmVyOiB2aWV3cG9ydC5lbmRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIG1heFNjcm9sbFBvc2l0aW9uOiB2aWV3cG9ydC5tYXhTY3JvbGxQb3NpdGlvblxuICAgICAgICAgICAgICAgIH0gOiB1bmRlZmluZWQ7XG5cblxuICAgICAgICAgICAgICAgIGlmIChzdGFydENoYW5nZWQgfHwgZW5kQ2hhbmdlZCB8fCBzY3JvbGxQb3NpdGlvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlQ2hhbmdlZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc2Nyb2xsIGxpc3QgdG8gdHJpZ2dlciByZS1yZW5kZXIgb2YgY29tcG9uZW50cyBpbiB2aWV3cG9ydFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3UG9ydEl0ZW1zID0gdmlld3BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXIgPj0gMCAmJiB2aWV3cG9ydC5lbmRJbmRleFdpdGhCdWZmZXIgPj0gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5zbGljZSh2aWV3cG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlciwgdmlld3BvcnQuZW5kSW5kZXhXaXRoQnVmZmVyICsgMSkgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnNVcGRhdGUuZW1pdCh0aGlzLnZpZXdQb3J0SXRlbXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52c1N0YXJ0LmVtaXQoY2hhbmdlRXZlbnRBcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnNFbmQuZW1pdChjaGFuZ2VFdmVudEFyZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydENoYW5nZWQgfHwgZW5kQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52c0NoYW5nZS5lbWl0KGNoYW5nZUV2ZW50QXJnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heFJ1blRpbWVzID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSwgcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrLCBtYXhSdW5UaW1lcyAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXhlY3V0ZVJlZnJlc2hPdXRzaWRlQW5ndWxhclpvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNoYW5nZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oaGFuZGxlQ2hhbmdlZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF4UnVuVGltZXMgPiAwICYmIChzY3JvbGxMZW5ndGhDaGFuZ2VkIHx8IHBhZGRpbmdDaGFuZ2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlLCByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2ssIG1heFJ1blRpbWVzIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0U2Nyb2xsRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudFNjcm9sbCBpbnN0YW5jZW9mIFdpbmRvdyA/IGRvY3VtZW50LnNjcm9sbGluZ0VsZW1lbnQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5IDogdGhpcy5wYXJlbnRTY3JvbGwgfHwgdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFkZFNjcm9sbEV2ZW50SGFuZGxlcnMoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5ndWxhclVuaXZlcnNhbFNTUikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuXG4gICAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oJ3dpbmRvdycsICdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VSZXNpemVIYW5kbGVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oJ3dpbmRvdycsICdyZXNpemUnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlU2Nyb2xsSGFuZGxlciA9IHRoaXMucmVuZGVyZXIubGlzdGVuKHNjcm9sbEVsZW1lbnQsICdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkVGltZXIgPSAoc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMuX2NoZWNrUmVzaXplSW50ZXJ2YWwpIGFzIGFueSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVtb3ZlU2Nyb2xsRXZlbnRIYW5kbGVycygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZFRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZFRpbWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zZVJlc2l6ZUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZVJlc2l6ZUhhbmRsZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZVJlc2l6ZUhhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0RWxlbWVudHNPZmZzZXQoKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmd1bGFyVW5pdmVyc2FsU1NSKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvZmZzZXQgPSAwO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYgJiYgdGhpcy5jb250YWluZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudFt0aGlzLl9vZmZzZXRUeXBlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcmVudFNjcm9sbCkge1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudENsaWVudFJlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbENsaWVudFJlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKHNjcm9sbEVsZW1lbnQpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBlbGVtZW50Q2xpZW50UmVjdC5sZWZ0IC0gc2Nyb2xsQ2xpZW50UmVjdC5sZWZ0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gZWxlbWVudENsaWVudFJlY3QudG9wIC0gc2Nyb2xsQ2xpZW50UmVjdC50b3A7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghKHRoaXMucGFyZW50U2Nyb2xsIGluc3RhbmNlb2YgV2luZG93KSkge1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBzY3JvbGxFbGVtZW50W3RoaXMuX3Njcm9sbFR5cGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY291bnRJdGVtc1BlcldyYXBHcm91cCgpOiBudW1iZXIge1xuICAgICAgICBpZiAodGhpcy5pc0FuZ3VsYXJVbml2ZXJzYWxTU1IpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuaG9yaXpvbnRhbCA/IHRoaXMuc3NyVmlld3BvcnRIZWlnaHQgLyB0aGlzLnNzckNoaWxkSGVpZ2h0IDogdGhpcy5zc3JWaWV3cG9ydFdpZHRoIC8gdGhpcy5zc3JDaGlsZFdpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHRoaXMuaG9yaXpvbnRhbCA/ICdvZmZzZXRMZWZ0JyA6ICdvZmZzZXRUb3AnO1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9ICgodGhpcy5jb250YWluZXJFbGVtZW50UmVmICYmIHRoaXMuY29udGFpbmVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSB8fFxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KS5jaGlsZHJlbjtcblxuICAgICAgICBjb25zdCBjaGlsZHJlbkxlbmd0aCA9IGNoaWxkcmVuID8gY2hpbGRyZW4ubGVuZ3RoIDogMDtcbiAgICAgICAgaWYgKGNoaWxkcmVuTGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpcnN0T2Zmc2V0ID0gY2hpbGRyZW5bMF1bcHJvcGVydHlOYW1lXTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IDE7XG4gICAgICAgIHdoaWxlIChyZXN1bHQgPCBjaGlsZHJlbkxlbmd0aCAmJiBmaXJzdE9mZnNldCA9PT0gY2hpbGRyZW5bcmVzdWx0XVtwcm9wZXJ0eU5hbWVdKSB7XG4gICAgICAgICAgICArK3Jlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldFNjcm9sbFN0YXJ0UG9zaXRpb24oKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IHdpbmRvd1Njcm9sbFZhbHVlO1xuICAgICAgICBpZiAodGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cpIHtcbiAgICAgICAgICAgIHdpbmRvd1Njcm9sbFZhbHVlID0gd2luZG93W3RoaXMuX3BhZ2VPZmZzZXRUeXBlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3aW5kb3dTY3JvbGxWYWx1ZSB8fCB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKVt0aGlzLl9zY3JvbGxUeXBlXSB8fCAwO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCByZXNldFdyYXBHcm91cERpbWVuc2lvbnMoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9sZFdyYXBHcm91cERpbWVuc2lvbnMgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnM7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZUFsbENhY2hlZE1lYXN1cmVtZW50cygpO1xuXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyB8fCAhb2xkV3JhcEdyb3VwRGltZW5zaW9ucyB8fCBvbGRXcmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtc1BlcldyYXBHcm91cDogbnVtYmVyID0gdGhpcy5jb3VudEl0ZW1zUGVyV3JhcEdyb3VwKCk7XG4gICAgICAgIGZvciAobGV0IHdyYXBHcm91cEluZGV4ID0gMDsgd3JhcEdyb3VwSW5kZXggPCBvbGRXcmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cC5sZW5ndGg7ICsrd3JhcEdyb3VwSW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IG9sZFdyYXBHcm91cERpbWVuc2lvbjogV3JhcEdyb3VwRGltZW5zaW9uID0gb2xkV3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbd3JhcEdyb3VwSW5kZXhdO1xuICAgICAgICAgICAgaWYgKCFvbGRXcmFwR3JvdXBEaW1lbnNpb24gfHwgIW9sZFdyYXBHcm91cERpbWVuc2lvbi5pdGVtcyB8fCAhb2xkV3JhcEdyb3VwRGltZW5zaW9uLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2xkV3JhcEdyb3VwRGltZW5zaW9uLml0ZW1zLmxlbmd0aCAhPT0gaXRlbXNQZXJXcmFwR3JvdXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBpdGVtc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGFycmF5U3RhcnRJbmRleCA9IGl0ZW1zUGVyV3JhcEdyb3VwICogd3JhcEdyb3VwSW5kZXg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zUGVyV3JhcEdyb3VwOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY29tcGFyZUl0ZW1zKG9sZFdyYXBHcm91cERpbWVuc2lvbi5pdGVtc1tpXSwgdGhpcy5pdGVtc1thcnJheVN0YXJ0SW5kZXggKyBpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWl0ZW1zQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICsrdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHMgKz0gb2xkV3JhcEdyb3VwRGltZW5zaW9uLmNoaWxkV2lkdGggfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0cyArPSBvbGRXcmFwR3JvdXBEaW1lbnNpb24uY2hpbGRIZWlnaHQgfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW3dyYXBHcm91cEluZGV4XSA9IG9sZFdyYXBHcm91cERpbWVuc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVEaW1lbnNpb25zKCk6IElEaW1lbnNpb25zIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuXG4gICAgICAgIGNvbnN0IG1heENhbGN1bGF0ZWRTY3JvbGxCYXJTaXplID0gMjU7IC8vIE5vdGU6IEZvcm11bGEgdG8gYXV0by1jYWxjdWxhdGUgZG9lc24ndCB3b3JrIGZvciBQYXJlbnRTY3JvbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgIHNvIHdlIGRlZmF1bHQgdG8gdGhpcyBpZiBub3Qgc2V0IGJ5IGNvbnN1bWluZyBhcHBsaWNhdGlvblxuICAgICAgICB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJIZWlnaHQgPSBNYXRoLm1heChNYXRoLm1pbihzY3JvbGxFbGVtZW50Lm9mZnNldEhlaWdodCAtIHNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUpLCB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJIZWlnaHQpO1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJXaWR0aCA9IE1hdGgubWF4KE1hdGgubWluKHNjcm9sbEVsZW1lbnQub2Zmc2V0V2lkdGggLSBzY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUpLCB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJXaWR0aCk7XG5cbiAgICAgICAgbGV0IHZpZXdwb3J0V2lkdGggPSBzY3JvbGxFbGVtZW50Lm9mZnNldFdpZHRoIC0gKHRoaXMuc2Nyb2xsYmFyV2lkdGggfHwgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFyV2lkdGggfHxcbiAgICAgICAgICAgICh0aGlzLmhvcml6b250YWwgPyAwIDogbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUpKTtcbiAgICAgICAgbGV0IHZpZXdwb3J0SGVpZ2h0ID0gc2Nyb2xsRWxlbWVudC5vZmZzZXRIZWlnaHQgLSAodGhpcy5zY3JvbGxiYXJIZWlnaHQgfHwgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFySGVpZ2h0IHx8XG4gICAgICAgICAgICAodGhpcy5ob3Jpem9udGFsID8gbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUgOiAwKSk7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9ICh0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYgJiYgdGhpcy5jb250YWluZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpIHx8IHRoaXMuY29udGVudEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgICBjb25zdCBpdGVtc1BlcldyYXBHcm91cCA9IHRoaXMuY291bnRJdGVtc1BlcldyYXBHcm91cCgpO1xuICAgICAgICBsZXQgd3JhcEdyb3Vwc1BlclBhZ2U7XG5cbiAgICAgICAgbGV0IGRlZmF1bHRDaGlsZFdpZHRoO1xuICAgICAgICBsZXQgZGVmYXVsdENoaWxkSGVpZ2h0O1xuXG4gICAgICAgIGlmICh0aGlzLmlzQW5ndWxhclVuaXZlcnNhbFNTUikge1xuICAgICAgICAgICAgdmlld3BvcnRXaWR0aCA9IHRoaXMuc3NyVmlld3BvcnRXaWR0aDtcbiAgICAgICAgICAgIHZpZXdwb3J0SGVpZ2h0ID0gdGhpcy5zc3JWaWV3cG9ydEhlaWdodDtcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZFdpZHRoID0gdGhpcy5zc3JDaGlsZFdpZHRoO1xuICAgICAgICAgICAgZGVmYXVsdENoaWxkSGVpZ2h0ID0gdGhpcy5zc3JDaGlsZEhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gTWF0aC5tYXgoTWF0aC5jZWlsKHZpZXdwb3J0V2lkdGggLyBkZWZhdWx0Q2hpbGRXaWR0aCksIDEpO1xuICAgICAgICAgICAgY29uc3QgaXRlbXNQZXJDb2wgPSBNYXRoLm1heChNYXRoLmNlaWwodmlld3BvcnRIZWlnaHQgLyBkZWZhdWx0Q2hpbGRIZWlnaHQpLCAxKTtcbiAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlID0gdGhpcy5ob3Jpem9udGFsID8gaXRlbXNQZXJSb3cgOiBpdGVtc1BlckNvbDtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgaWYgKGNvbnRlbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jaGlsZFdpZHRoIHx8ICF0aGlzLmNoaWxkSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggJiYgdmlld3BvcnRXaWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gdmlld3BvcnRXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCAmJiB2aWV3cG9ydEhlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCA9IHZpZXdwb3J0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjb250ZW50LmNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IE1hdGgubWluKHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoLCBjbGllbnRSZWN0LndpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSBNYXRoLm1pbih0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQsIGNsaWVudFJlY3QuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVmYXVsdENoaWxkV2lkdGggPSB0aGlzLmNoaWxkV2lkdGggfHwgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggfHwgdmlld3BvcnRXaWR0aDtcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZEhlaWdodCA9IHRoaXMuY2hpbGRIZWlnaHQgfHwgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0IHx8IHZpZXdwb3J0SGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgaXRlbXNQZXJSb3cgPSBNYXRoLm1heChNYXRoLmNlaWwodmlld3BvcnRXaWR0aCAvIGRlZmF1bHRDaGlsZFdpZHRoKSwgMSk7XG4gICAgICAgICAgICBjb25zdCBpdGVtc1BlckNvbCA9IE1hdGgubWF4KE1hdGguY2VpbCh2aWV3cG9ydEhlaWdodCAvIGRlZmF1bHRDaGlsZEhlaWdodCksIDEpO1xuICAgICAgICAgICAgd3JhcEdyb3Vwc1BlclBhZ2UgPSB0aGlzLmhvcml6b250YWwgPyBpdGVtc1BlclJvdyA6IGl0ZW1zUGVyQ29sO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjcm9sbE9mZnNldCA9IHNjcm9sbEVsZW1lbnRbdGhpcy5fc2Nyb2xsVHlwZV0gLSAodGhpcy5wcmV2aW91c1ZpZXdQb3J0ID8gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnBhZGRpbmcgOiAwKTtcblxuICAgICAgICAgICAgbGV0IGFycmF5U3RhcnRJbmRleCA9IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlciB8fCAwO1xuICAgICAgICAgICAgbGV0IHdyYXBHcm91cEluZGV4ID0gTWF0aC5jZWlsKGFycmF5U3RhcnRJbmRleCAvIGl0ZW1zUGVyV3JhcEdyb3VwKTtcblxuICAgICAgICAgICAgbGV0IG1heFdpZHRoRm9yV3JhcEdyb3VwID0gMDtcbiAgICAgICAgICAgIGxldCBtYXhIZWlnaHRGb3JXcmFwR3JvdXAgPSAwO1xuICAgICAgICAgICAgbGV0IHN1bU9mVmlzaWJsZU1heFdpZHRocyA9IDA7XG4gICAgICAgICAgICBsZXQgc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cyA9IDA7XG4gICAgICAgICAgICB3cmFwR3JvdXBzUGVyUGFnZSA9IDA7XG5cbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItZm9yLW9mXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRlbnQuY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICArK2FycmF5U3RhcnRJbmRleDtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IGNvbnRlbnQuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHRoaXMuZ2V0RWxlbWVudFNpemUoY2hpbGQpO1xuXG4gICAgICAgICAgICAgICAgbWF4V2lkdGhGb3JXcmFwR3JvdXAgPSBNYXRoLm1heChtYXhXaWR0aEZvcldyYXBHcm91cCwgY2xpZW50UmVjdC53aWR0aCk7XG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwID0gTWF0aC5tYXgobWF4SGVpZ2h0Rm9yV3JhcEdyb3VwLCBjbGllbnRSZWN0LmhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJyYXlTdGFydEluZGV4ICUgaXRlbXNQZXJXcmFwR3JvdXAgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW3dyYXBHcm91cEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAtLXRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHMgLT0gb2xkVmFsdWUuY2hpbGRXaWR0aCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgLT0gb2xkVmFsdWUuY2hpbGRIZWlnaHQgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICsrdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuaXRlbXMuc2xpY2UoYXJyYXlTdGFydEluZGV4IC0gaXRlbXNQZXJXcmFwR3JvdXAsIGFycmF5U3RhcnRJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbd3JhcEdyb3VwSW5kZXhdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRXaWR0aDogbWF4V2lkdGhGb3JXcmFwR3JvdXAsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZEhlaWdodDogbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRocyArPSBtYXhXaWR0aEZvcldyYXBHcm91cDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgKz0gbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvcml6b250YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXAgPSBNYXRoLm1pbihtYXhXaWR0aEZvcldyYXBHcm91cCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCh2aWV3cG9ydFdpZHRoIC0gc3VtT2ZWaXNpYmxlTWF4V2lkdGhzLCAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbE9mZnNldFRvUmVtb3ZlID0gTWF0aC5taW4oc2Nyb2xsT2Zmc2V0LCBtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFZpc2libGVXaWR0aEZvcldyYXBHcm91cCAtPSBzY3JvbGxPZmZzZXRUb1JlbW92ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQgLT0gc2Nyb2xsT2Zmc2V0VG9SZW1vdmU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bU9mVmlzaWJsZU1heFdpZHRocyArPSBtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXA7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4VmlzaWJsZVdpZHRoRm9yV3JhcEdyb3VwID4gMCAmJiB2aWV3cG9ydFdpZHRoID49IHN1bU9mVmlzaWJsZU1heFdpZHRocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrd3JhcEdyb3Vwc1BlclBhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWF4VmlzaWJsZUhlaWdodEZvcldyYXBHcm91cCA9IE1hdGgubWluKG1heEhlaWdodEZvcldyYXBHcm91cCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCh2aWV3cG9ydEhlaWdodCAtIHN1bU9mVmlzaWJsZU1heEhlaWdodHMsIDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsT2Zmc2V0VG9SZW1vdmUgPSBNYXRoLm1pbihzY3JvbGxPZmZzZXQsIG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXAgLT0gc2Nyb2xsT2Zmc2V0VG9SZW1vdmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IHNjcm9sbE9mZnNldFRvUmVtb3ZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1PZlZpc2libGVNYXhIZWlnaHRzICs9IG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXA7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4VmlzaWJsZUhlaWdodEZvcldyYXBHcm91cCA+IDAgJiYgdmlld3BvcnRIZWlnaHQgPj0gc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrd3JhcEdyb3Vwc1BlclBhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICArK3dyYXBHcm91cEluZGV4O1xuXG4gICAgICAgICAgICAgICAgICAgIG1heFdpZHRoRm9yV3JhcEdyb3VwID0gMDtcbiAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGF2ZXJhZ2VDaGlsZFdpZHRoID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRocyAvXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgY29uc3QgYXZlcmFnZUNoaWxkSGVpZ2h0ID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgL1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZFdpZHRoID0gdGhpcy5jaGlsZFdpZHRoIHx8IGF2ZXJhZ2VDaGlsZFdpZHRoIHx8IHZpZXdwb3J0V2lkdGg7XG4gICAgICAgICAgICBkZWZhdWx0Q2hpbGRIZWlnaHQgPSB0aGlzLmNoaWxkSGVpZ2h0IHx8IGF2ZXJhZ2VDaGlsZEhlaWdodCB8fCB2aWV3cG9ydEhlaWdodDtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgIGlmICh2aWV3cG9ydFdpZHRoID4gc3VtT2ZWaXNpYmxlTWF4V2lkdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlICs9IE1hdGguY2VpbCgodmlld3BvcnRXaWR0aCAtIHN1bU9mVmlzaWJsZU1heFdpZHRocykgLyBkZWZhdWx0Q2hpbGRXaWR0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodmlld3BvcnRIZWlnaHQgPiBzdW1PZlZpc2libGVNYXhIZWlnaHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlICs9IE1hdGguY2VpbCgodmlld3BvcnRIZWlnaHQgLSBzdW1PZlZpc2libGVNYXhIZWlnaHRzKSAvIGRlZmF1bHRDaGlsZEhlaWdodCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXRlbUNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGl0ZW1zUGVyUGFnZSA9IGl0ZW1zUGVyV3JhcEdyb3VwICogd3JhcEdyb3Vwc1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IHBhZ2VDb3VudEZyYWN0aW9uYWwgPSBpdGVtQ291bnQgLyBpdGVtc1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IG51bWJlck9mV3JhcEdyb3VwcyA9IE1hdGguY2VpbChpdGVtQ291bnQgLyBpdGVtc1BlcldyYXBHcm91cCk7XG5cbiAgICAgICAgbGV0IHNjcm9sbExlbmd0aCA9IDA7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCA9IHRoaXMuaG9yaXpvbnRhbCA/IGRlZmF1bHRDaGlsZFdpZHRoIDogZGVmYXVsdENoaWxkSGVpZ2h0O1xuICAgICAgICBpZiAodGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgbGV0IG51bVVua25vd25DaGlsZFNpemVzID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZXcmFwR3JvdXBzOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZFNpemUgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2ldICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV1bdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZFNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IGNoaWxkU2l6ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICArK251bVVua25vd25DaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IE1hdGgucm91bmQobnVtVW5rbm93bkNoaWxkU2l6ZXMgKiBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aCA9IG51bWJlck9mV3JhcEdyb3VwcyAqIGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5oZWFkZXJFbGVtZW50UmVmKSB7XG4gICAgICAgICAgICBzY3JvbGxMZW5ndGggKz0gdGhpcy5oZWFkZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgdmlld3BvcnRMZW5ndGggPSB0aGlzLmhvcml6b250YWwgPyB2aWV3cG9ydFdpZHRoIDogdmlld3BvcnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IG1heFNjcm9sbFBvc2l0aW9uID0gTWF0aC5tYXgoc2Nyb2xsTGVuZ3RoIC0gdmlld3BvcnRMZW5ndGgsIDApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjaGlsZEhlaWdodDogZGVmYXVsdENoaWxkSGVpZ2h0LFxuICAgICAgICAgICAgY2hpbGRXaWR0aDogZGVmYXVsdENoaWxkV2lkdGgsXG4gICAgICAgICAgICBpdGVtQ291bnQsXG4gICAgICAgICAgICBpdGVtc1BlclBhZ2UsXG4gICAgICAgICAgICBpdGVtc1BlcldyYXBHcm91cCxcbiAgICAgICAgICAgIG1heFNjcm9sbFBvc2l0aW9uLFxuICAgICAgICAgICAgcGFnZUNvdW50X2ZyYWN0aW9uYWw6IHBhZ2VDb3VudEZyYWN0aW9uYWwsXG4gICAgICAgICAgICBzY3JvbGxMZW5ndGgsXG4gICAgICAgICAgICB2aWV3cG9ydExlbmd0aCxcbiAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVQYWRkaW5nKGFycmF5U3RhcnRJbmRleFdpdGhCdWZmZXI6IG51bWJlciwgZGltZW5zaW9uczogSURpbWVuc2lvbnMpOiBudW1iZXIge1xuICAgICAgICBpZiAoZGltZW5zaW9ucy5pdGVtQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCA9IGRpbWVuc2lvbnNbdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICBjb25zdCBzdGFydGluZ1dyYXBHcm91cEluZGV4ID0gTWF0aC5mbG9vcihhcnJheVN0YXJ0SW5kZXhXaXRoQnVmZmVyIC8gZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cCkgfHwgMDtcblxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwICogc3RhcnRpbmdXcmFwR3JvdXBJbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBudW1Vbmtub3duQ2hpbGRTaXplcyA9IDA7XG4gICAgICAgIGxldCByZXN1bHQgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YXJ0aW5nV3JhcEdyb3VwSW5kZXg7ICsraSkge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRTaXplID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXSAmJlxuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV1bdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICAgICAgaWYgKGNoaWxkU2l6ZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjaGlsZFNpemU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrbnVtVW5rbm93bkNoaWxkU2l6ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IE1hdGgucm91bmQobnVtVW5rbm93bkNoaWxkU2l6ZXMgKiBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVQYWdlSW5mbyhzY3JvbGxQb3NpdGlvbjogbnVtYmVyLCBkaW1lbnNpb25zOiBJRGltZW5zaW9ucyk6IElQYWdlSW5mbyB7XG4gICAgICAgIGxldCBzY3JvbGxQZXJjZW50YWdlID0gMDtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG51bWJlck9mV3JhcEdyb3VwcyA9IE1hdGguY2VpbChkaW1lbnNpb25zLml0ZW1Db3VudCAvIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXApO1xuICAgICAgICAgICAgbGV0IHRvdGFsU2Nyb2xsZWRMZW5ndGggPSAwO1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCA9IGRpbWVuc2lvbnNbdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZldyYXBHcm91cHM7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkU2l6ZSA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV0gJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXVt0aGlzLl9jaGlsZFNjcm9sbERpbV07XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFNjcm9sbGVkTGVuZ3RoICs9IGNoaWxkU2l6ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFNjcm9sbGVkTGVuZ3RoICs9IGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbFBvc2l0aW9uIDwgdG90YWxTY3JvbGxlZExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxQZXJjZW50YWdlID0gaSAvIG51bWJlck9mV3JhcEdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsUGVyY2VudGFnZSA9IHNjcm9sbFBvc2l0aW9uIC8gZGltZW5zaW9ucy5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGFydGluZ0FycmF5SW5kZXhGcmFjdGlvbmFsID0gTWF0aC5taW4oTWF0aC5tYXgoc2Nyb2xsUGVyY2VudGFnZSAqIGRpbWVuc2lvbnMucGFnZUNvdW50X2ZyYWN0aW9uYWwsIDApLFxuICAgICAgICAgICAgZGltZW5zaW9ucy5wYWdlQ291bnRfZnJhY3Rpb25hbCkgKiBkaW1lbnNpb25zLml0ZW1zUGVyUGFnZTtcblxuICAgICAgICBjb25zdCBtYXhTdGFydCA9IGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gZGltZW5zaW9ucy5pdGVtc1BlclBhZ2UgLSAxO1xuICAgICAgICBsZXQgYXJyYXlTdGFydEluZGV4ID0gTWF0aC5taW4oTWF0aC5mbG9vcihzdGFydGluZ0FycmF5SW5kZXhGcmFjdGlvbmFsKSwgbWF4U3RhcnQpO1xuICAgICAgICBhcnJheVN0YXJ0SW5kZXggLT0gYXJyYXlTdGFydEluZGV4ICUgZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cDsgLy8gcm91bmQgZG93biB0byBzdGFydCBvZiB3cmFwR3JvdXBcblxuICAgICAgICBpZiAodGhpcy5zdHJpcGVkVGFibGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlckJvdW5kYXJ5ID0gMiAqIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXA7XG4gICAgICAgICAgICBpZiAoYXJyYXlTdGFydEluZGV4ICUgYnVmZmVyQm91bmRhcnkgIT09IDApIHtcbiAgICAgICAgICAgICAgICBhcnJheVN0YXJ0SW5kZXggPSBNYXRoLm1heChhcnJheVN0YXJ0SW5kZXggLSBhcnJheVN0YXJ0SW5kZXggJSBidWZmZXJCb3VuZGFyeSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYXJyYXlFbmRJbmRleCA9IE1hdGguY2VpbChzdGFydGluZ0FycmF5SW5kZXhGcmFjdGlvbmFsKSArIGRpbWVuc2lvbnMuaXRlbXNQZXJQYWdlIC0gMTtcbiAgICAgICAgY29uc3QgZW5kSW5kZXhXaXRoaW5XcmFwR3JvdXAgPSAoYXJyYXlFbmRJbmRleCArIDEpICUgZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cDtcbiAgICAgICAgaWYgKGVuZEluZGV4V2l0aGluV3JhcEdyb3VwID4gMCkge1xuICAgICAgICAgICAgYXJyYXlFbmRJbmRleCArPSBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwIC0gZW5kSW5kZXhXaXRoaW5XcmFwR3JvdXA7IC8vIHJvdW5kIHVwIHRvIGVuZCBvZiB3cmFwR3JvdXBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc05hTihhcnJheVN0YXJ0SW5kZXgpKSB7XG4gICAgICAgICAgICBhcnJheVN0YXJ0SW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc05hTihhcnJheUVuZEluZGV4KSkge1xuICAgICAgICAgICAgYXJyYXlFbmRJbmRleCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheVN0YXJ0SW5kZXggPSBNYXRoLm1pbihNYXRoLm1heChhcnJheVN0YXJ0SW5kZXgsIDApLCBkaW1lbnNpb25zLml0ZW1Db3VudCAtIDEpO1xuICAgICAgICBhcnJheUVuZEluZGV4ID0gTWF0aC5taW4oTWF0aC5tYXgoYXJyYXlFbmRJbmRleCwgMCksIGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gMSk7XG5cbiAgICAgICAgY29uc3QgYnVmZmVyU2l6ZSA9IHRoaXMuYnVmZmVyQW1vdW50ICogZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cDtcbiAgICAgICAgY29uc3Qgc3RhcnRJbmRleFdpdGhCdWZmZXIgPSBNYXRoLm1pbihNYXRoLm1heChhcnJheVN0YXJ0SW5kZXggLSBidWZmZXJTaXplLCAwKSwgZGltZW5zaW9ucy5pdGVtQ291bnQgLSAxKTtcbiAgICAgICAgY29uc3QgZW5kSW5kZXhXaXRoQnVmZmVyID0gTWF0aC5taW4oTWF0aC5tYXgoYXJyYXlFbmRJbmRleCArIGJ1ZmZlclNpemUsIDApLCBkaW1lbnNpb25zLml0ZW1Db3VudCAtIDEpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydEluZGV4OiBhcnJheVN0YXJ0SW5kZXgsXG4gICAgICAgICAgICBlbmRJbmRleDogYXJyYXlFbmRJbmRleCxcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgZW5kSW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbjogc2Nyb2xsUG9zaXRpb24sXG4gICAgICAgICAgICBzY3JvbGxFbmRQb3NpdGlvbjogc2Nyb2xsUG9zaXRpb24gKyBkaW1lbnNpb25zLnZpZXdwb3J0TGVuZ3RoLFxuICAgICAgICAgICAgbWF4U2Nyb2xsUG9zaXRpb246IGRpbWVuc2lvbnMubWF4U2Nyb2xsUG9zaXRpb25cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY2FsY3VsYXRlVmlld3BvcnQoKTogSVZpZXdwb3J0IHtcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IHRoaXMuY2FsY3VsYXRlRGltZW5zaW9ucygpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmdldEVsZW1lbnRzT2Zmc2V0KCk7XG5cbiAgICAgICAgbGV0IHNjcm9sbFN0YXJ0UG9zaXRpb24gPSB0aGlzLmdldFNjcm9sbFN0YXJ0UG9zaXRpb24oKTtcbiAgICAgICAgaWYgKHNjcm9sbFN0YXJ0UG9zaXRpb24gPiAoZGltZW5zaW9ucy5zY3JvbGxMZW5ndGggKyBvZmZzZXQpICYmICEodGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cpKSB7XG4gICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uID0gZGltZW5zaW9ucy5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uIC09IG9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uID0gTWF0aC5tYXgoMCwgc2Nyb2xsU3RhcnRQb3NpdGlvbik7XG5cbiAgICAgICAgY29uc3QgcGFnZUluZm8gPSB0aGlzLmNhbGN1bGF0ZVBhZ2VJbmZvKHNjcm9sbFN0YXJ0UG9zaXRpb24sIGRpbWVuc2lvbnMpO1xuICAgICAgICBjb25zdCBuZXdQYWRkaW5nID0gdGhpcy5jYWxjdWxhdGVQYWRkaW5nKHBhZ2VJbmZvLnN0YXJ0SW5kZXhXaXRoQnVmZmVyLCBkaW1lbnNpb25zKTtcbiAgICAgICAgY29uc3QgbmV3U2Nyb2xsTGVuZ3RoID0gZGltZW5zaW9ucy5zY3JvbGxMZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXJ0SW5kZXg6IHBhZ2VJbmZvLnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICBlbmRJbmRleDogcGFnZUluZm8uZW5kSW5kZXgsXG4gICAgICAgICAgICBzdGFydEluZGV4V2l0aEJ1ZmZlcjogcGFnZUluZm8uc3RhcnRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICBlbmRJbmRleFdpdGhCdWZmZXI6IHBhZ2VJbmZvLmVuZEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgIHBhZGRpbmc6IE1hdGgucm91bmQobmV3UGFkZGluZyksXG4gICAgICAgICAgICBzY3JvbGxMZW5ndGg6IE1hdGgucm91bmQobmV3U2Nyb2xsTGVuZ3RoKSxcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb246IHBhZ2VJbmZvLnNjcm9sbFN0YXJ0UG9zaXRpb24sXG4gICAgICAgICAgICBzY3JvbGxFbmRQb3NpdGlvbjogcGFnZUluZm8uc2Nyb2xsRW5kUG9zaXRpb24sXG4gICAgICAgICAgICBtYXhTY3JvbGxQb3NpdGlvbjogcGFnZUluZm8ubWF4U2Nyb2xsUG9zaXRpb25cbiAgICAgICAgfTtcbiAgICB9XG59XG5cbkBOZ01vZHVsZSh7XG4gICAgZXhwb3J0czogW1ZpcnR1YWxTY3JvbGxlckNvbXBvbmVudF0sXG4gICAgZGVjbGFyYXRpb25zOiBbVmlydHVhbFNjcm9sbGVyQ29tcG9uZW50XSxcbiAgICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcbiAgICBwcm92aWRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgcHJvdmlkZTogJ3ZpcnR1YWwtc2Nyb2xsZXItZGVmYXVsdC1vcHRpb25zJyxcbiAgICAgICAgICAgIHVzZUZhY3Rvcnk6IFZJUlRVQUxfU0NST0xMRVJfREVGQVVMVF9PUFRJT05TX0ZBQ1RPUllcbiAgICAgICAgfVxuICAgIF1cbn0pXG5leHBvcnQgY2xhc3MgVmlydHVhbFNjcm9sbGVyTW9kdWxlIHtcbn1cbiJdfQ==