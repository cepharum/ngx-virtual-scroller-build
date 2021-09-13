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
                    let oldStartItemIndex = -1;
                    for (let i = 0, l = this.items, n = this.items.length; i < n; i++) {
                        if (this.compareItems(oldStartItem, l[i])) {
                            oldStartItemIndex = i;
                            break;
                        }
                    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC12aXJ0dWFsLXNjcm9sbGVyLyIsInNvdXJjZXMiOlsidmlydHVhbC1zY3JvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUNILGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsWUFBWSxFQUFFLE9BQU8sRUFDckIsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxNQUFNLEVBQ04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsU0FBUyxHQUNaLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFakQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTdDLE9BQU8sS0FBSyxLQUFLLE1BQU0sbUJBQW1CLENBQUE7QUFjMUMsTUFBTSxVQUFVLHdDQUF3QztJQUNwRCxPQUFPO1FBQ0gsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixpQ0FBaUMsRUFBRSxJQUFJO1FBQ3ZDLDRCQUE0QixFQUFFLENBQUM7UUFDL0IsbUJBQW1CLEVBQUUsR0FBRztRQUN4QixrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLG9CQUFvQixFQUFFLENBQUM7UUFDdkIsWUFBWSxFQUFFLEtBQUs7S0FDdEIsQ0FBQztBQUNOLENBQUM7QUE4SEQsSUFBYSx3QkFBd0IsR0FBckMsTUFBYSx3QkFBd0I7SUEySGpDLFlBQ3VCLE9BQW1CLEVBQ25CLFFBQW1CLEVBQ25CLElBQVksRUFDckIsaUJBQW9DO0lBQzlDLHFDQUFxQztJQUNoQixVQUFrQixFQUVuQyxPQUFzQztRQVB2QixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBQ25CLGFBQVEsR0FBUixRQUFR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Q29tcG9uZW50LFxuICAgIENvbnRlbnRDaGlsZCwgRG9DaGVjayxcbiAgICBFbGVtZW50UmVmLFxuICAgIEV2ZW50RW1pdHRlcixcbiAgICBJbmplY3QsXG4gICAgSW5wdXQsXG4gICAgTmdNb2R1bGUsXG4gICAgTmdab25lLFxuICAgIE9uQ2hhbmdlcyxcbiAgICBPbkRlc3Ryb3ksXG4gICAgT25Jbml0LFxuICAgIE9wdGlvbmFsLFxuICAgIE91dHB1dCxcbiAgICBSZW5kZXJlcjIsXG4gICAgVmlld0NoaWxkLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtQTEFURk9STV9JRH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1TZXJ2ZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCB7Q29tbW9uTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5pbXBvcnQgKiBhcyB0d2VlbiBmcm9tICdAdHdlZW5qcy90d2Vlbi5qcydcblxuZXhwb3J0IGludGVyZmFjZSBWaXJ0dWFsU2Nyb2xsZXJEZWZhdWx0T3B0aW9ucyB7XG4gICAgY2hlY2tSZXNpemVJbnRlcnZhbDogbnVtYmVyXG4gICAgbW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsOiBib29sZWFuLFxuICAgIHJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQ6IG51bWJlcixcbiAgICBzY3JvbGxBbmltYXRpb25UaW1lOiBudW1iZXI7XG4gICAgc2Nyb2xsRGVib3VuY2VUaW1lOiBudW1iZXI7XG4gICAgc2Nyb2xsVGhyb3R0bGluZ1RpbWU6IG51bWJlcjtcbiAgICBzY3JvbGxiYXJIZWlnaHQ/OiBudW1iZXI7XG4gICAgc2Nyb2xsYmFyV2lkdGg/OiBudW1iZXI7XG4gICAgc3RyaXBlZFRhYmxlOiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBWSVJUVUFMX1NDUk9MTEVSX0RFRkFVTFRfT1BUSU9OU19GQUNUT1JZKCk6IFZpcnR1YWxTY3JvbGxlckRlZmF1bHRPcHRpb25zIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjaGVja1Jlc2l6ZUludGVydmFsOiAxMDAwLFxuICAgICAgICBtb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGw6IHRydWUsXG4gICAgICAgIHJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQ6IDUsXG4gICAgICAgIHNjcm9sbEFuaW1hdGlvblRpbWU6IDc1MCxcbiAgICAgICAgc2Nyb2xsRGVib3VuY2VUaW1lOiAwLFxuICAgICAgICBzY3JvbGxUaHJvdHRsaW5nVGltZTogMCxcbiAgICAgICAgc3RyaXBlZFRhYmxlOiBmYWxzZVxuICAgIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JhcEdyb3VwRGltZW5zaW9ucyB7XG4gICAgbWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwOiBXcmFwR3JvdXBEaW1lbnNpb25bXTtcbiAgICBudW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplczogbnVtYmVyO1xuICAgIHN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHM6IG51bWJlcjtcbiAgICBzdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBXcmFwR3JvdXBEaW1lbnNpb24ge1xuICAgIGNoaWxkSGVpZ2h0OiBudW1iZXI7XG4gICAgY2hpbGRXaWR0aDogbnVtYmVyO1xuICAgIGl0ZW1zOiBhbnlbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRGltZW5zaW9ucyB7XG4gICAgY2hpbGRIZWlnaHQ6IG51bWJlcjtcbiAgICBjaGlsZFdpZHRoOiBudW1iZXI7XG4gICAgaXRlbUNvdW50OiBudW1iZXI7XG4gICAgaXRlbXNQZXJQYWdlOiBudW1iZXI7XG4gICAgaXRlbXNQZXJXcmFwR3JvdXA6IG51bWJlcjtcbiAgICBtYXhTY3JvbGxQb3NpdGlvbjogbnVtYmVyO1xuICAgIHBhZ2VDb3VudF9mcmFjdGlvbmFsOiBudW1iZXI7XG4gICAgc2Nyb2xsTGVuZ3RoOiBudW1iZXI7XG4gICAgdmlld3BvcnRMZW5ndGg6IG51bWJlcjtcbiAgICB3cmFwR3JvdXBzUGVyUGFnZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElQYWdlSW5mbyB7XG4gICAgZW5kSW5kZXg6IG51bWJlcjtcbiAgICBlbmRJbmRleFdpdGhCdWZmZXI6IG51bWJlcjtcbiAgICBtYXhTY3JvbGxQb3NpdGlvbjogbnVtYmVyO1xuICAgIHNjcm9sbEVuZFBvc2l0aW9uOiBudW1iZXI7XG4gICAgc2Nyb2xsU3RhcnRQb3NpdGlvbjogbnVtYmVyO1xuICAgIHN0YXJ0SW5kZXg6IG51bWJlcjtcbiAgICBzdGFydEluZGV4V2l0aEJ1ZmZlcjogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElWaWV3cG9ydCBleHRlbmRzIElQYWdlSW5mbyB7XG4gICAgcGFkZGluZzogbnVtYmVyO1xuICAgIHNjcm9sbExlbmd0aDogbnVtYmVyO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ3ZpcnR1YWwtc2Nyb2xsZXIsW3ZpcnR1YWxTY3JvbGxlcl0nLFxuICAgIGV4cG9ydEFzOiAndmlydHVhbFNjcm9sbGVyJyxcbiAgICB0ZW1wbGF0ZTogYFxuICAgICAgICA8ZGl2IGNsYXNzPVwidG90YWwtcGFkZGluZ1wiICNpbnZpc2libGVQYWRkaW5nPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsYWJsZS1jb250ZW50XCIgI2NvbnRlbnQ+XG4gICAgICAgICAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG4gICAgICAgIDwvZGl2PlxuICAgIGAsXG4gICAgaG9zdDoge1xuICAgICAgICAnW2NsYXNzLmhvcml6b250YWxdJzogJ2hvcml6b250YWwnLFxuICAgICAgICAnW2NsYXNzLnZlcnRpY2FsXSc6ICchaG9yaXpvbnRhbCcsXG4gICAgICAgICdbY2xhc3Muc2VsZlNjcm9sbF0nOiAnIXBhcmVudFNjcm9sbCcsXG4gICAgICAgICdbY2xhc3MucnRsXSc6ICdSVEwnXG4gICAgfSxcbiAgICBzdHlsZXM6IFtgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICAgICAgLXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6IHRvdWNoO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbC5zZWxmU2Nyb2xsIHtcbiAgICAgICAgICAgIG92ZXJmbG93LXk6IHZpc2libGU7XG4gICAgICAgICAgICBvdmVyZmxvdy14OiBhdXRvO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbC5zZWxmU2Nyb2xsLnJ0bCB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlWCgtMSk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC52ZXJ0aWNhbC5zZWxmU2Nyb2xsIHtcbiAgICAgICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgICAgICBvdmVyZmxvdy14OiB2aXNpYmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgLnNjcm9sbGFibGUtY29udGVudCB7XG4gICAgICAgICAgICB0b3A6IDA7XG4gICAgICAgICAgICBsZWZ0OiAwO1xuICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgICBtYXgtd2lkdGg6IDEwMHZ3O1xuICAgICAgICAgICAgbWF4LWhlaWdodDogMTAwdmg7XG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIH1cblxuICAgICAgICAuc2Nyb2xsYWJsZS1jb250ZW50IDo6bmctZGVlcCA+ICoge1xuICAgICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0Lmhvcml6b250YWwge1xuICAgICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0Lmhvcml6b250YWwgLnNjcm9sbGFibGUtY29udGVudCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbCAuc2Nyb2xsYWJsZS1jb250ZW50IDo6bmctZGVlcCA+ICoge1xuICAgICAgICAgICAgZmxleC1zaHJpbms6IDA7XG4gICAgICAgICAgICBmbGV4LWdyb3c6IDA7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogaW5pdGlhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0Lmhvcml6b250YWwucnRsIC5zY3JvbGxhYmxlLWNvbnRlbnQgOjpuZy1kZWVwID4gKiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlWCgtMSk7XG4gICAgICAgIH1cblxuICAgICAgICAudG90YWwtcGFkZGluZyB7XG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICB0b3A6IDA7XG4gICAgICAgICAgICBsZWZ0OiAwO1xuICAgICAgICAgICAgaGVpZ2h0OiAxcHg7XG4gICAgICAgICAgICB3aWR0aDogMXB4O1xuICAgICAgICAgICAgdHJhbnNmb3JtLW9yaWdpbjogMCAwO1xuICAgICAgICAgICAgb3BhY2l0eTogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0Lmhvcml6b250YWwgLnRvdGFsLXBhZGRpbmcge1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB9XG4gICAgYF1cbn0pXG5leHBvcnQgY2xhc3MgVmlydHVhbFNjcm9sbGVyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMsIE9uRGVzdHJveSwgRG9DaGVjayB7XG5cbiAgICBwdWJsaWMgZ2V0IHZpZXdQb3J0SW5mbygpOiBJUGFnZUluZm8ge1xuICAgICAgICBjb25zdCBwYWdlSW5mbzogSVZpZXdwb3J0ID0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0IHx8ICh7fSBhcyBhbnkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhcnRJbmRleDogcGFnZUluZm8uc3RhcnRJbmRleCB8fCAwLFxuICAgICAgICAgICAgZW5kSW5kZXg6IHBhZ2VJbmZvLmVuZEluZGV4IHx8IDAsXG4gICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uOiBwYWdlSW5mby5zY3JvbGxTdGFydFBvc2l0aW9uIHx8IDAsXG4gICAgICAgICAgICBzY3JvbGxFbmRQb3NpdGlvbjogcGFnZUluZm8uc2Nyb2xsRW5kUG9zaXRpb24gfHwgMCxcbiAgICAgICAgICAgIG1heFNjcm9sbFBvc2l0aW9uOiBwYWdlSW5mby5tYXhTY3JvbGxQb3NpdGlvbiB8fCAwLFxuICAgICAgICAgICAgc3RhcnRJbmRleFdpdGhCdWZmZXI6IHBhZ2VJbmZvLnN0YXJ0SW5kZXhXaXRoQnVmZmVyIHx8IDAsXG4gICAgICAgICAgICBlbmRJbmRleFdpdGhCdWZmZXI6IHBhZ2VJbmZvLmVuZEluZGV4V2l0aEJ1ZmZlciB8fCAwXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IGVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXM7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBlbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyh2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICBpZiAodGhpcy5fZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyA9IHZhbHVlO1xuICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBidWZmZXJBbW91bnQoKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHR5cGVvZiAodGhpcy5fYnVmZmVyQW1vdW50KSA9PT0gJ251bWJlcicgJiYgdGhpcy5fYnVmZmVyQW1vdW50ID49IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9idWZmZXJBbW91bnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyA/IDUgOiAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBidWZmZXJBbW91bnQodmFsdWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLl9idWZmZXJBbW91bnQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgc2Nyb2xsVGhyb3R0bGluZ1RpbWUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Njcm9sbFRocm90dGxpbmdUaW1lO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgc2Nyb2xsVGhyb3R0bGluZ1RpbWUodmFsdWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLl9zY3JvbGxUaHJvdHRsaW5nVGltZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnVwZGF0ZU9uU2Nyb2xsRnVuY3Rpb24oKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgc2Nyb2xsRGVib3VuY2VUaW1lKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY3JvbGxEZWJvdW5jZVRpbWU7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBzY3JvbGxEZWJvdW5jZVRpbWUodmFsdWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLl9zY3JvbGxEZWJvdW5jZVRpbWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy51cGRhdGVPblNjcm9sbEZ1bmN0aW9uKCk7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IGNoZWNrUmVzaXplSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrUmVzaXplSW50ZXJ2YWw7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBjaGVja1Jlc2l6ZUludGVydmFsKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NoZWNrUmVzaXplSW50ZXJ2YWwgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jaGVja1Jlc2l6ZUludGVydmFsID0gdmFsdWU7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBpdGVtcygpOiBhbnlbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pdGVtcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGl0ZW1zKHZhbHVlOiBhbnlbXSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IHRoaXMuX2l0ZW1zKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pdGVtcyA9IHZhbHVlIHx8IFtdO1xuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwodHJ1ZSk7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IGhvcml6b250YWwoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ob3Jpem9udGFsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgaG9yaXpvbnRhbCh2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICB0aGlzLl9ob3Jpem9udGFsID0gdmFsdWU7XG4gICAgICAgIHRoaXMudXBkYXRlRGlyZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IHBhcmVudFNjcm9sbCgpOiBFbGVtZW50IHwgV2luZG93IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudFNjcm9sbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHBhcmVudFNjcm9sbCh2YWx1ZTogRWxlbWVudCB8IFdpbmRvdykge1xuICAgICAgICBpZiAodGhpcy5fcGFyZW50U2Nyb2xsID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXZlcnRQYXJlbnRPdmVyc2Nyb2xsKCk7XG4gICAgICAgIHRoaXMuX3BhcmVudFNjcm9sbCA9IHZhbHVlO1xuICAgICAgICB0aGlzLmFkZFNjcm9sbEV2ZW50SGFuZGxlcnMoKTtcblxuICAgICAgICBjb25zdCBzY3JvbGxFbGVtZW50ID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KCk7XG4gICAgICAgIGlmICh0aGlzLm1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbCAmJiBzY3JvbGxFbGVtZW50ICE9PSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdyA9IHt4OiBzY3JvbGxFbGVtZW50LnN0eWxlWydvdmVyZmxvdy14J10sIHk6IHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXknXX07XG4gICAgICAgICAgICBzY3JvbGxFbGVtZW50LnN0eWxlWydvdmVyZmxvdy15J10gPSB0aGlzLmhvcml6b250YWwgPyAndmlzaWJsZScgOiAnYXV0byc7XG4gICAgICAgICAgICBzY3JvbGxFbGVtZW50LnN0eWxlWydvdmVyZmxvdy14J10gPSB0aGlzLmhvcml6b250YWwgPyAnYXV0bycgOiAndmlzaWJsZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IGVsZW1lbnQ6IEVsZW1lbnRSZWYsXG4gICAgICAgIHByb3RlY3RlZCByZWFkb25seSByZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgem9uZTogTmdab25lLFxuICAgICAgICBwcm90ZWN0ZWQgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6YmFuLXR5cGVzXG4gICAgICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHBsYXRmb3JtSWQ6IE9iamVjdCxcbiAgICAgICAgQE9wdGlvbmFsKCkgQEluamVjdCgndmlydHVhbC1zY3JvbGxlci1kZWZhdWx0LW9wdGlvbnMnKVxuICAgICAgICAgICAgb3B0aW9uczogVmlydHVhbFNjcm9sbGVyRGVmYXVsdE9wdGlvbnNcbiAgICApIHtcblxuICAgICAgICB0aGlzLmlzQW5ndWxhclVuaXZlcnNhbFNTUiA9IGlzUGxhdGZvcm1TZXJ2ZXIocGxhdGZvcm1JZCk7XG5cbiAgICAgICAgdGhpcy5jaGVja1Jlc2l6ZUludGVydmFsID0gb3B0aW9ucy5jaGVja1Jlc2l6ZUludGVydmFsO1xuICAgICAgICB0aGlzLm1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbCA9IG9wdGlvbnMubW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsO1xuICAgICAgICB0aGlzLnJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQgPSBvcHRpb25zLnJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsQW5pbWF0aW9uVGltZSA9IG9wdGlvbnMuc2Nyb2xsQW5pbWF0aW9uVGltZTtcbiAgICAgICAgdGhpcy5zY3JvbGxEZWJvdW5jZVRpbWUgPSBvcHRpb25zLnNjcm9sbERlYm91bmNlVGltZTtcbiAgICAgICAgdGhpcy5zY3JvbGxUaHJvdHRsaW5nVGltZSA9IG9wdGlvbnMuc2Nyb2xsVGhyb3R0bGluZ1RpbWU7XG4gICAgICAgIHRoaXMuc2Nyb2xsYmFySGVpZ2h0ID0gb3B0aW9ucy5zY3JvbGxiYXJIZWlnaHQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsYmFyV2lkdGggPSBvcHRpb25zLnNjcm9sbGJhcldpZHRoO1xuICAgICAgICB0aGlzLnN0cmlwZWRUYWJsZSA9IG9wdGlvbnMuc3RyaXBlZFRhYmxlO1xuXG4gICAgICAgIHRoaXMuaG9yaXpvbnRhbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlc2V0V3JhcEdyb3VwRGltZW5zaW9ucygpO1xuICAgIH1cblxuICAgIHB1YmxpYyB2aWV3UG9ydEl0ZW1zOiBhbnlbXTtcbiAgICBwdWJsaWMgd2luZG93ID0gd2luZG93O1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZXhlY3V0ZVJlZnJlc2hPdXRzaWRlQW5ndWxhclpvbmUgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBfZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMgPSBmYWxzZTtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIFJUTCA9IGZhbHNlO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgdXNlTWFyZ2luSW5zdGVhZE9mVHJhbnNsYXRlID0gZmFsc2U7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBtb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGw6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzdHJpcGVkVGFibGU6IGJvb2xlYW47XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzY3JvbGxiYXJXaWR0aDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc2Nyb2xsYmFySGVpZ2h0OiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBjaGlsZFdpZHRoOiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBjaGlsZEhlaWdodDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc3NyQ2hpbGRXaWR0aDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc3NyQ2hpbGRIZWlnaHQ6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNzclZpZXdwb3J0V2lkdGggPSAxOTIwO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc3NyVmlld3BvcnRIZWlnaHQgPSAxMDgwO1xuXG4gICAgcHJvdGVjdGVkIF9idWZmZXJBbW91bnQ6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNjcm9sbEFuaW1hdGlvblRpbWU6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCBfc2Nyb2xsVGhyb3R0bGluZ1RpbWU6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCBfc2Nyb2xsRGVib3VuY2VUaW1lOiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgb25TY3JvbGw6ICgpID0+IHZvaWQ7XG5cbiAgICBwcm90ZWN0ZWQgY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZFRpbWVyOiBudW1iZXI7XG4gICAgcHJvdGVjdGVkIF9jaGVja1Jlc2l6ZUludGVydmFsOiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgX2l0ZW1zOiBhbnlbXSA9IFtdO1xuXG4gICAgcHJvdGVjdGVkIF9ob3Jpem9udGFsOiBib29sZWFuO1xuXG4gICAgcHJvdGVjdGVkIG9sZFBhcmVudFNjcm9sbE92ZXJmbG93OiB7IHg6IHN0cmluZywgeTogc3RyaW5nIH07XG4gICAgcHJvdGVjdGVkIF9wYXJlbnRTY3JvbGw6IEVsZW1lbnQgfCBXaW5kb3c7XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgdnNVcGRhdGU6IEV2ZW50RW1pdHRlcjxhbnlbXT4gPSBuZXcgRXZlbnRFbWl0dGVyPGFueVtdPigpO1xuXG4gICAgQE91dHB1dCgpXG4gICAgcHVibGljIHZzQ2hhbmdlOiBFdmVudEVtaXR0ZXI8SVBhZ2VJbmZvPiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBhZ2VJbmZvPigpO1xuXG4gICAgQE91dHB1dCgpXG4gICAgcHVibGljIHZzU3RhcnQ6IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+KCk7XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgdnNFbmQ6IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+KCk7XG5cbiAgICBAVmlld0NoaWxkKCdjb250ZW50Jywge3JlYWQ6IEVsZW1lbnRSZWYsIHN0YXRpYzogdHJ1ZX0pXG4gICAgcHJvdGVjdGVkIGNvbnRlbnRFbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gICAgQFZpZXdDaGlsZCgnaW52aXNpYmxlUGFkZGluZycsIHtyZWFkOiBFbGVtZW50UmVmLCBzdGF0aWM6IHRydWV9KVxuICAgIHByb3RlY3RlZCBpbnZpc2libGVQYWRkaW5nRWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAgIEBDb250ZW50Q2hpbGQoJ2hlYWRlcicsIHtyZWFkOiBFbGVtZW50UmVmLCBzdGF0aWM6IGZhbHNlfSlcbiAgICBwcm90ZWN0ZWQgaGVhZGVyRWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAgIEBDb250ZW50Q2hpbGQoJ2NvbnRhaW5lcicsIHtyZWFkOiBFbGVtZW50UmVmLCBzdGF0aWM6IGZhbHNlfSlcbiAgICBwcm90ZWN0ZWQgY29udGFpbmVyRWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAgIHByb3RlY3RlZCBpc0FuZ3VsYXJVbml2ZXJzYWxTU1I6IGJvb2xlYW47XG5cbiAgICBwcm90ZWN0ZWQgcHJldmlvdXNTY3JvbGxCb3VuZGluZ1JlY3Q6IENsaWVudFJlY3Q7XG5cbiAgICBwcm90ZWN0ZWQgX2ludmlzaWJsZVBhZGRpbmdQcm9wZXJ0eTtcbiAgICBwcm90ZWN0ZWQgX29mZnNldFR5cGU7XG4gICAgcHJvdGVjdGVkIF9zY3JvbGxUeXBlO1xuICAgIHByb3RlY3RlZCBfcGFnZU9mZnNldFR5cGU7XG4gICAgcHJvdGVjdGVkIF9jaGlsZFNjcm9sbERpbTtcbiAgICBwcm90ZWN0ZWQgX3RyYW5zbGF0ZURpcjtcbiAgICBwcm90ZWN0ZWQgX21hcmdpbkRpcjtcblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVkU2Nyb2xsYmFyV2lkdGggPSAwO1xuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVkU2Nyb2xsYmFySGVpZ2h0ID0gMDtcblxuICAgIHByb3RlY3RlZCBwYWRkaW5nID0gMDtcbiAgICBwcm90ZWN0ZWQgcHJldmlvdXNWaWV3UG9ydDogSVZpZXdwb3J0ID0ge30gYXMgYW55O1xuICAgIHByb3RlY3RlZCBjdXJyZW50VHdlZW46IHR3ZWVuLlR3ZWVuO1xuICAgIHByb3RlY3RlZCBjYWNoZWRJdGVtc0xlbmd0aDogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIGRpc3Bvc2VTY3JvbGxIYW5kbGVyOiAoKSA9PiB2b2lkIHwgdW5kZWZpbmVkO1xuICAgIHByb3RlY3RlZCBkaXNwb3NlUmVzaXplSGFuZGxlcjogKCkgPT4gdm9pZCB8IHVuZGVmaW5lZDtcblxuICAgIHByb3RlY3RlZCBtaW5NZWFzdXJlZENoaWxkV2lkdGg6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgbWluTWVhc3VyZWRDaGlsZEhlaWdodDogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIHdyYXBHcm91cERpbWVuc2lvbnM6IFdyYXBHcm91cERpbWVuc2lvbnM7XG5cbiAgICBwcm90ZWN0ZWQgY2FjaGVkUGFnZVNpemUgPSAwO1xuICAgIHByb3RlY3RlZCBwcmV2aW91c1Njcm9sbE51bWJlckVsZW1lbnRzID0gMDtcblxuICAgIHByb3RlY3RlZCB1cGRhdGVPblNjcm9sbEZ1bmN0aW9uKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxEZWJvdW5jZVRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMub25TY3JvbGwgPSAodGhpcy5kZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICAgICAgICAgIH0sIHRoaXMuc2Nyb2xsRGVib3VuY2VUaW1lKSBhcyBhbnkpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2Nyb2xsVGhyb3R0bGluZ1RpbWUpIHtcbiAgICAgICAgICAgIHRoaXMub25TY3JvbGwgPSAodGhpcy50aHJvdHRsZVRyYWlsaW5nKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfSwgdGhpcy5zY3JvbGxUaHJvdHRsaW5nVGltZSkgYXMgYW55KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25TY3JvbGwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBjb21wYXJlSXRlbXM6IChpdGVtMTogYW55LCBpdGVtMjogYW55KSA9PiBib29sZWFuID0gKGl0ZW0xOiBhbnksIGl0ZW0yOiBhbnkpID0+IGl0ZW0xID09PSBpdGVtMjtcblxuICAgIHByb3RlY3RlZCByZXZlcnRQYXJlbnRPdmVyc2Nyb2xsKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzY3JvbGxFbGVtZW50ID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KCk7XG4gICAgICAgIGlmIChzY3JvbGxFbGVtZW50ICYmIHRoaXMub2xkUGFyZW50U2Nyb2xsT3ZlcmZsb3cpIHtcbiAgICAgICAgICAgIHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXknXSA9IHRoaXMub2xkUGFyZW50U2Nyb2xsT3ZlcmZsb3cueTtcbiAgICAgICAgICAgIHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXgnXSA9IHRoaXMub2xkUGFyZW50U2Nyb2xsT3ZlcmZsb3cueDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub2xkUGFyZW50U2Nyb2xsT3ZlcmZsb3cgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFkZFNjcm9sbEV2ZW50SGFuZGxlcnMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuICAgICAgICB0aGlzLnJldmVydFBhcmVudE92ZXJzY3JvbGwoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGluZGV4TGVuZ3RoQ2hhbmdlZCA9IHRoaXMuY2FjaGVkSXRlbXNMZW5ndGggIT09IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB0aGlzLmNhY2hlZEl0ZW1zTGVuZ3RoID0gdGhpcy5pdGVtcy5sZW5ndGg7XG5cbiAgICAgICAgY29uc3QgZmlyc3RSdW46IGJvb2xlYW4gPSAhY2hhbmdlcy5pdGVtcyB8fCAhY2hhbmdlcy5pdGVtcy5wcmV2aW91c1ZhbHVlIHx8IGNoYW5nZXMuaXRlbXMucHJldmlvdXNWYWx1ZS5sZW5ndGggPT09IDA7XG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChpbmRleExlbmd0aENoYW5nZWQgfHwgZmlyc3RSdW4pO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ0RvQ2hlY2soKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmNhY2hlZEl0ZW1zTGVuZ3RoICE9PSB0aGlzLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5jYWNoZWRJdGVtc0xlbmd0aCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucHJldmlvdXNWaWV3UG9ydCAmJiB0aGlzLnZpZXdQb3J0SXRlbXMgJiYgdGhpcy52aWV3UG9ydEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxldCBpdGVtc0FycmF5Q2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnZpZXdQb3J0SXRlbXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY29tcGFyZUl0ZW1zKHRoaXMuaXRlbXNbdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXhXaXRoQnVmZmVyICsgaV0sIHRoaXMudmlld1BvcnRJdGVtc1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXNBcnJheUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbXNBcnJheUNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVmcmVzaCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKHRydWUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbnZhbGlkYXRlQWxsQ2FjaGVkTWVhc3VyZW1lbnRzKCk6IHZvaWQge1xuICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICBtYXhDaGlsZFNpemVQZXJXcmFwR3JvdXA6IFtdLFxuICAgICAgICAgICAgbnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM6IDAsXG4gICAgICAgICAgICBzdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHM6IDAsXG4gICAgICAgICAgICBzdW1PZktub3duV3JhcEdyb3VwQ2hpbGRIZWlnaHRzOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbnZhbGlkYXRlQ2FjaGVkTWVhc3VyZW1lbnRGb3JJdGVtKGl0ZW06IGFueSk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLml0ZW1zICYmIHRoaXMuaXRlbXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlQ2FjaGVkTWVhc3VyZW1lbnRBdEluZGV4KGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW52YWxpZGF0ZUNhY2hlZE1lYXN1cmVtZW50QXRJbmRleChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKSB7XG4gICAgICAgICAgICBjb25zdCBjYWNoZWRNZWFzdXJlbWVudCA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKGNhY2hlZE1lYXN1cmVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpbmRleF0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgLS10aGlzLndyYXBHcm91cERpbWVuc2lvbnMubnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM7XG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRocyAtPSBjYWNoZWRNZWFzdXJlbWVudC5jaGlsZFdpZHRoIHx8IDA7XG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgLT0gY2FjaGVkTWVhc3VyZW1lbnQuY2hpbGRIZWlnaHQgfHwgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2Nyb2xsSW50byhpdGVtOiBhbnksIGFsaWduVG9CZWdpbm5pbmc6IGJvb2xlYW4gPSB0cnVlLCBhZGRpdGlvbmFsT2Zmc2V0OiBudW1iZXIgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbk1pbGxpc2Vjb25kcz86IG51bWJlciwgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2s/OiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGluZGV4OiBudW1iZXIgPSB0aGlzLml0ZW1zLmluZGV4T2YoaXRlbSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9JbmRleChpbmRleCwgYWxpZ25Ub0JlZ2lubmluZywgYWRkaXRpb25hbE9mZnNldCwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjayk7XG4gICAgfVxuXG4gICAgcHVibGljIHNjcm9sbFRvSW5kZXgoaW5kZXg6IG51bWJlciwgYWxpZ25Ub0JlZ2lubmluZzogYm9vbGVhbiA9IHRydWUsIGFkZGl0aW9uYWxPZmZzZXQ6IG51bWJlciA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uTWlsbGlzZWNvbmRzPzogbnVtYmVyLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgbGV0IG1heFJldHJpZXMgPSA1O1xuXG4gICAgICAgIGNvbnN0IHJldHJ5SWZOZWVkZWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAtLW1heFJldHJpZXM7XG4gICAgICAgICAgICBpZiAobWF4UmV0cmllcyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IHRoaXMuY2FsY3VsYXRlRGltZW5zaW9ucygpO1xuICAgICAgICAgICAgY29uc3QgZGVzaXJlZFN0YXJ0SW5kZXggPSBNYXRoLm1pbihNYXRoLm1heChpbmRleCwgMCksIGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gMSk7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXggPT09IGRlc2lyZWRTdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0luZGV4X2ludGVybmFsKGluZGV4LCBhbGlnblRvQmVnaW5uaW5nLCBhZGRpdGlvbmFsT2Zmc2V0LCAwLCByZXRyeUlmTmVlZGVkKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNjcm9sbFRvSW5kZXhfaW50ZXJuYWwoaW5kZXgsIGFsaWduVG9CZWdpbm5pbmcsIGFkZGl0aW9uYWxPZmZzZXQsIGFuaW1hdGlvbk1pbGxpc2Vjb25kcywgcmV0cnlJZk5lZWRlZCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNjcm9sbFRvSW5kZXhfaW50ZXJuYWwoaW5kZXg6IG51bWJlciwgYWxpZ25Ub0JlZ2lubmluZzogYm9vbGVhbiA9IHRydWUsIGFkZGl0aW9uYWxPZmZzZXQ6IG51bWJlciA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uTWlsbGlzZWNvbmRzPzogbnVtYmVyLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgYW5pbWF0aW9uTWlsbGlzZWNvbmRzID0gYW5pbWF0aW9uTWlsbGlzZWNvbmRzID09PSB1bmRlZmluZWQgPyB0aGlzLnNjcm9sbEFuaW1hdGlvblRpbWUgOiBhbmltYXRpb25NaWxsaXNlY29uZHM7XG5cbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IHRoaXMuY2FsY3VsYXRlRGltZW5zaW9ucygpO1xuICAgICAgICBsZXQgc2Nyb2xsID0gdGhpcy5jYWxjdWxhdGVQYWRkaW5nKGluZGV4LCBkaW1lbnNpb25zKSArIGFkZGl0aW9uYWxPZmZzZXQ7XG4gICAgICAgIGlmICghYWxpZ25Ub0JlZ2lubmluZykge1xuICAgICAgICAgICAgc2Nyb2xsIC09IGRpbWVuc2lvbnMud3JhcEdyb3Vwc1BlclBhZ2UgKiBkaW1lbnNpb25zW3RoaXMuX2NoaWxkU2Nyb2xsRGltXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Qb3NpdGlvbihzY3JvbGwsIGFuaW1hdGlvbk1pbGxpc2Vjb25kcywgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spO1xuICAgIH1cblxuICAgIHB1YmxpYyBzY3JvbGxUb1Bvc2l0aW9uKHNjcm9sbFBvc2l0aW9uOiBudW1iZXIsIGFuaW1hdGlvbk1pbGxpc2Vjb25kcz86IG51bWJlciwgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2s/OiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIHNjcm9sbFBvc2l0aW9uICs9IHRoaXMuZ2V0RWxlbWVudHNPZmZzZXQoKTtcblxuICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHMgPSBhbmltYXRpb25NaWxsaXNlY29uZHMgPT09IHVuZGVmaW5lZCA/IHRoaXMuc2Nyb2xsQW5pbWF0aW9uVGltZSA6IGFuaW1hdGlvbk1pbGxpc2Vjb25kcztcblxuICAgICAgICBjb25zdCBzY3JvbGxFbGVtZW50ID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KCk7XG5cbiAgICAgICAgbGV0IGFuaW1hdGlvblJlcXVlc3Q6IG51bWJlcjtcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50VHdlZW4pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFR3ZWVuLnN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFR3ZWVuID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhbmltYXRpb25NaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UHJvcGVydHkoc2Nyb2xsRWxlbWVudCwgdGhpcy5fc2Nyb2xsVHlwZSwgc2Nyb2xsUG9zaXRpb24pO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0d2VlbkNvbmZpZ09iaiA9IHtzY3JvbGxQb3NpdGlvbjogc2Nyb2xsRWxlbWVudFt0aGlzLl9zY3JvbGxUeXBlXX07XG5cbiAgICAgICAgY29uc3QgbmV3VHdlZW4gPSBuZXcgdHdlZW4uVHdlZW4odHdlZW5Db25maWdPYmopXG4gICAgICAgICAgICAudG8oe3Njcm9sbFBvc2l0aW9ufSwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzKVxuICAgICAgICAgICAgLmVhc2luZyh0d2Vlbi5FYXNpbmcuUXVhZHJhdGljLk91dClcbiAgICAgICAgICAgIC5vblVwZGF0ZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpc05hTihkYXRhLnNjcm9sbFBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UHJvcGVydHkoc2Nyb2xsRWxlbWVudCwgdGhpcy5fc2Nyb2xsVHlwZSwgZGF0YS5zY3JvbGxQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub25TdG9wKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShhbmltYXRpb25SZXF1ZXN0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKTtcblxuICAgICAgICBjb25zdCBhbmltYXRlID0gKHRpbWU/OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICghbmV3VHdlZW4uaXNQbGF5aW5nKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ld1R3ZWVuLnVwZGF0ZSh0aW1lKTtcbiAgICAgICAgICAgIGlmICh0d2VlbkNvbmZpZ09iai5zY3JvbGxQb3NpdGlvbiA9PT0gc2Nyb2xsUG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uUmVxdWVzdCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFuaW1hdGUoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VHdlZW4gPSBuZXdUd2VlbjtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0RWxlbWVudFNpemUoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBDbGllbnRSZWN0IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3Qgc3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcbiAgICAgICAgY29uc3QgbWFyZ2luVG9wID0gcGFyc2VJbnQoc3R5bGVzWydtYXJnaW4tdG9wJ10sIDEwKSB8fCAwO1xuICAgICAgICBjb25zdCBtYXJnaW5Cb3R0b20gPSBwYXJzZUludChzdHlsZXNbJ21hcmdpbi1ib3R0b20nXSwgMTApIHx8IDA7XG4gICAgICAgIGNvbnN0IG1hcmdpbkxlZnQgPSBwYXJzZUludChzdHlsZXNbJ21hcmdpbi1sZWZ0J10sIDEwKSB8fCAwO1xuICAgICAgICBjb25zdCBtYXJnaW5SaWdodCA9IHBhcnNlSW50KHN0eWxlc1snbWFyZ2luLXJpZ2h0J10sIDEwKSB8fCAwO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IHJlc3VsdC50b3AgKyBtYXJnaW5Ub3AsXG4gICAgICAgICAgICBib3R0b206IHJlc3VsdC5ib3R0b20gKyBtYXJnaW5Cb3R0b20sXG4gICAgICAgICAgICBsZWZ0OiByZXN1bHQubGVmdCArIG1hcmdpbkxlZnQsXG4gICAgICAgICAgICByaWdodDogcmVzdWx0LnJpZ2h0ICsgbWFyZ2luUmlnaHQsXG4gICAgICAgICAgICB3aWR0aDogcmVzdWx0LndpZHRoICsgbWFyZ2luTGVmdCArIG1hcmdpblJpZ2h0LFxuICAgICAgICAgICAgaGVpZ2h0OiByZXN1bHQuaGVpZ2h0ICsgbWFyZ2luVG9wICsgbWFyZ2luQm90dG9tXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGNoZWNrU2Nyb2xsRWxlbWVudFJlc2l6ZWQoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGJvdW5kaW5nUmVjdCA9IHRoaXMuZ2V0RWxlbWVudFNpemUodGhpcy5nZXRTY3JvbGxFbGVtZW50KCkpO1xuXG4gICAgICAgIGxldCBzaXplQ2hhbmdlZDogYm9vbGVhbjtcbiAgICAgICAgaWYgKCF0aGlzLnByZXZpb3VzU2Nyb2xsQm91bmRpbmdSZWN0KSB7XG4gICAgICAgICAgICBzaXplQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aENoYW5nZSA9IE1hdGguYWJzKGJvdW5kaW5nUmVjdC53aWR0aCAtIHRoaXMucHJldmlvdXNTY3JvbGxCb3VuZGluZ1JlY3Qud2lkdGgpO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0Q2hhbmdlID0gTWF0aC5hYnMoYm91bmRpbmdSZWN0LmhlaWdodCAtIHRoaXMucHJldmlvdXNTY3JvbGxCb3VuZGluZ1JlY3QuaGVpZ2h0KTtcbiAgICAgICAgICAgIHNpemVDaGFuZ2VkID0gd2lkdGhDaGFuZ2UgPiB0aGlzLnJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQgfHwgaGVpZ2h0Q2hhbmdlID4gdGhpcy5yZXNpemVCeXBhc3NSZWZyZXNoVGhyZXNob2xkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNpemVDaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzU2Nyb2xsQm91bmRpbmdSZWN0ID0gYm91bmRpbmdSZWN0O1xuICAgICAgICAgICAgaWYgKGJvdW5kaW5nUmVjdC53aWR0aCA+IDAgJiYgYm91bmRpbmdSZWN0LmhlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHVwZGF0ZURpcmVjdGlvbigpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgdGhpcy5fY2hpbGRTY3JvbGxEaW0gPSAnY2hpbGRXaWR0aCc7XG4gICAgICAgICAgICB0aGlzLl9pbnZpc2libGVQYWRkaW5nUHJvcGVydHkgPSAnc2NhbGVYJztcbiAgICAgICAgICAgIHRoaXMuX21hcmdpbkRpciA9ICdtYXJnaW4tbGVmdCc7XG4gICAgICAgICAgICB0aGlzLl9vZmZzZXRUeXBlID0gJ29mZnNldExlZnQnO1xuICAgICAgICAgICAgdGhpcy5fcGFnZU9mZnNldFR5cGUgPSAncGFnZVhPZmZzZXQnO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsVHlwZSA9ICdzY3JvbGxMZWZ0JztcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zbGF0ZURpciA9ICd0cmFuc2xhdGVYJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkU2Nyb2xsRGltID0gJ2NoaWxkSGVpZ2h0JztcbiAgICAgICAgICAgIHRoaXMuX2ludmlzaWJsZVBhZGRpbmdQcm9wZXJ0eSA9ICdzY2FsZVknO1xuICAgICAgICAgICAgdGhpcy5fbWFyZ2luRGlyID0gJ21hcmdpbi10b3AnO1xuICAgICAgICAgICAgdGhpcy5fb2Zmc2V0VHlwZSA9ICdvZmZzZXRUb3AnO1xuICAgICAgICAgICAgdGhpcy5fcGFnZU9mZnNldFR5cGUgPSAncGFnZVlPZmZzZXQnO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsVHlwZSA9ICdzY3JvbGxUb3AnO1xuICAgICAgICAgICAgdGhpcy5fdHJhbnNsYXRlRGlyID0gJ3RyYW5zbGF0ZVknO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGRlYm91bmNlKGZ1bmM6ICgpID0+IGFueSwgd2FpdDogbnVtYmVyKTogKCkgPT4gYW55IHtcbiAgICAgICAgY29uc3QgdGhyb3R0bGVkID0gdGhpcy50aHJvdHRsZVRyYWlsaW5nKGZ1bmMsIHdhaXQpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAodGhyb3R0bGVkIGFzIGFueSkuY2FuY2VsKCk7XG4gICAgICAgICAgICB0aHJvdHRsZWQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVzdWx0LmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICh0aHJvdHRsZWQgYXMgYW55KS5jYW5jZWwoKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB0aHJvdHRsZVRyYWlsaW5nKGZ1bmM6ICgpID0+IGFueSwgd2FpdDogbnVtYmVyKTogKCkgPT4gYW55IHtcbiAgICAgICAgbGV0IHRpbWVvdXQ7XG4gICAgICAgIGxldCBfYXJndW1lbnRzID0gYXJndW1lbnRzO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBfYXJndW1lbnRzID0gYXJndW1lbnRzXG5cbiAgICAgICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAod2FpdCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgZnVuYy5hcHBseShfdGhpcywgX2FyZ3VtZW50cyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseShfdGhpcywgX2FyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfSwgd2FpdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlc3VsdC5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHJlZnJlc2hfaW50ZXJuYWwoaXRlbXNBcnJheU1vZGlmaWVkOiBib29sZWFuLCByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2s/OiAoKSA9PiB2b2lkLCBtYXhSdW5UaW1lczogbnVtYmVyID0gMik6IHZvaWQge1xuICAgICAgICAvLyBub3RlOiBtYXhSdW5UaW1lcyBpcyB0byBmb3JjZSBpdCB0byBrZWVwIHJlY2FsY3VsYXRpbmcgaWYgdGhlIHByZXZpb3VzIGl0ZXJhdGlvbiBjYXVzZWQgYSByZS1yZW5kZXJcbiAgICAgICAgLy8gICAgICAgKGRpZmZlcmVudCBzbGljZWQgaXRlbXMgaW4gdmlld3BvcnQgb3Igc2Nyb2xsUG9zaXRpb24gY2hhbmdlZCkuXG4gICAgICAgIC8vIFRoZSBkZWZhdWx0IG9mIDJ4IG1heCB3aWxsIHByb2JhYmx5IGJlIGFjY3VyYXRlIGVub3VnaCB3aXRob3V0IGNhdXNpbmcgdG9vIGxhcmdlIGEgcGVyZm9ybWFuY2UgYm90dGxlbmVja1xuICAgICAgICAvLyBUaGUgY29kZSB3b3VsZCB0eXBpY2FsbHkgcXVpdCBvdXQgb24gdGhlIDJuZCBpdGVyYXRpb24gYW55d2F5cy4gVGhlIG1haW4gdGltZSBpdCdkIHRoaW5rIG1vcmUgdGhhbiAyIHJ1bnNcbiAgICAgICAgLy8gd291bGQgYmUgbmVjZXNzYXJ5IHdvdWxkIGJlIGZvciB2YXN0bHkgZGlmZmVyZW50IHNpemVkIGNoaWxkIGl0ZW1zIG9yIGlmIHRoaXMgaXMgdGhlIDFzdCB0aW1lIHRoZSBpdGVtcyBhcnJheVxuICAgICAgICAvLyB3YXMgaW5pdGlhbGl6ZWQuXG4gICAgICAgIC8vIFdpdGhvdXQgbWF4UnVuVGltZXMsIElmIHRoZSB1c2VyIGlzIGFjdGl2ZWx5IHNjcm9sbGluZyB0aGlzIGNvZGUgd291bGQgYmVjb21lIGFuIGluZmluaXRlIGxvb3AgdW50aWwgdGhleVxuICAgICAgICAvLyBzdG9wcGVkIHNjcm9sbGluZy4gVGhpcyB3b3VsZCBiZSBva2F5LCBleGNlcHQgZWFjaCBzY3JvbGwgZXZlbnQgd291bGQgc3RhcnQgYW4gYWRkaXRpb25hbCBpbmZpbml0ZSBsb29wLiBXZVxuICAgICAgICAvLyB3YW50IHRvIHNob3J0LWNpcmN1aXQgaXQgdG8gcHJldmVudCB0aGlzLlxuXG4gICAgICAgIGlmIChpdGVtc0FycmF5TW9kaWZpZWQgJiYgdGhpcy5wcmV2aW91c1ZpZXdQb3J0ICYmIHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxTdGFydFBvc2l0aW9uID4gMCkge1xuICAgICAgICAgICAgLy8gaWYgaXRlbXMgd2VyZSBwcmVwZW5kZWQsIHNjcm9sbCBmb3J3YXJkIHRvIGtlZXAgc2FtZSBpdGVtcyB2aXNpYmxlXG4gICAgICAgICAgICBjb25zdCBvbGRWaWV3UG9ydCA9IHRoaXMucHJldmlvdXNWaWV3UG9ydDtcbiAgICAgICAgICAgIGNvbnN0IG9sZFZpZXdQb3J0SXRlbXMgPSB0aGlzLnZpZXdQb3J0SXRlbXM7XG5cblx0XHRcdGNvbnN0IG9sZFJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjayA9IHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaztcblx0XHRcdHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjayA9ICgpID0+IHtcblx0XHRcdFx0Y29uc3Qgc2Nyb2xsTGVuZ3RoRGVsdGEgPSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc2Nyb2xsTGVuZ3RoIC0gb2xkVmlld1BvcnQuc2Nyb2xsTGVuZ3RoO1xuXHRcdFx0XHRpZiAoc2Nyb2xsTGVuZ3RoRGVsdGEgPiAwICYmIHRoaXMudmlld1BvcnRJdGVtcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleCAtIHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhcnRJdGVtID0gb2xkVmlld1BvcnRJdGVtc1tvZmZzZXRdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkU3RhcnRJdGVtSW5kZXggPSAtMTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDAsIGwgPSB0aGlzLml0ZW1zLCBuID0gdGhpcy5pdGVtcy5sZW5ndGg7IGkgPCBuOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jb21wYXJlSXRlbXMob2xkU3RhcnRJdGVtLCBsW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN0YXJ0SXRlbUluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRTdGFydEl0ZW1JbmRleCA+IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbU9yZGVyQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMSwgbCA9IHRoaXMudmlld1BvcnRJdGVtcy5sZW5ndGggLSBvZmZzZXQ7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY29tcGFyZUl0ZW1zKHRoaXMuaXRlbXNbb2xkU3RhcnRJdGVtSW5kZXggKyBpXSwgb2xkVmlld1BvcnRJdGVtc1tvZmZzZXQgKyBpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbU9yZGVyQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtT3JkZXJDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb1Bvc2l0aW9uKHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxTdGFydFBvc2l0aW9uICsgc2Nyb2xsTGVuZ3RoRGVsdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsIG9sZFJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9sZFJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBvbGRSZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXRlbXNBcnJheU1vZGlmaWVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRXcmFwR3JvdXBEaW1lbnNpb25zKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy5jYWxjdWxhdGVWaWV3cG9ydCgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRDaGFuZ2VkID0gaXRlbXNBcnJheU1vZGlmaWVkIHx8IHZpZXdwb3J0LnN0YXJ0SW5kZXggIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4O1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuZENoYW5nZWQgPSBpdGVtc0FycmF5TW9kaWZpZWQgfHwgdmlld3BvcnQuZW5kSW5kZXggIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5lbmRJbmRleDtcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JvbGxMZW5ndGhDaGFuZ2VkID0gdmlld3BvcnQuc2Nyb2xsTGVuZ3RoICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhZGRpbmdDaGFuZ2VkID0gdmlld3BvcnQucGFkZGluZyAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnBhZGRpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsUG9zaXRpb25DaGFuZ2VkID0gdmlld3BvcnQuc2Nyb2xsU3RhcnRQb3NpdGlvbiAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbFN0YXJ0UG9zaXRpb24gfHxcbiAgICAgICAgICAgICAgICAgICAgdmlld3BvcnQuc2Nyb2xsRW5kUG9zaXRpb24gIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxFbmRQb3NpdGlvbiB8fFxuICAgICAgICAgICAgICAgICAgICB2aWV3cG9ydC5tYXhTY3JvbGxQb3NpdGlvbiAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0Lm1heFNjcm9sbFBvc2l0aW9uO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aW91c1ZpZXdQb3J0ID0gdmlld3BvcnQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsTGVuZ3RoQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuaW52aXNpYmxlUGFkZGluZ0VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3RyYW5zZm9ybScsIGAke3RoaXMuX2ludmlzaWJsZVBhZGRpbmdQcm9wZXJ0eX0oJHt2aWV3cG9ydC5zY3JvbGxMZW5ndGh9KWApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuaW52aXNpYmxlUGFkZGluZ0VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3dlYmtpdFRyYW5zZm9ybScsIGAke3RoaXMuX2ludmlzaWJsZVBhZGRpbmdQcm9wZXJ0eX0oJHt2aWV3cG9ydC5zY3JvbGxMZW5ndGh9KWApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChwYWRkaW5nQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy51c2VNYXJnaW5JbnN0ZWFkT2ZUcmFuc2xhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5jb250ZW50RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCB0aGlzLl9tYXJnaW5EaXIsIGAke3ZpZXdwb3J0LnBhZGRpbmd9cHhgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5jb250ZW50RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAndHJhbnNmb3JtJywgYCR7dGhpcy5fdHJhbnNsYXRlRGlyfSgke3ZpZXdwb3J0LnBhZGRpbmd9cHgpYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuY29udGVudEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3dlYmtpdFRyYW5zZm9ybScsIGAke3RoaXMuX3RyYW5zbGF0ZURpcn0oJHt2aWV3cG9ydC5wYWRkaW5nfXB4KWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGVhZGVyRWxlbWVudFJlZikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpW3RoaXMuX3Njcm9sbFR5cGVdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXJPZmZzZXQgPSB0aGlzLmdldEVsZW1lbnRzT2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IE1hdGgubWF4KHNjcm9sbFBvc2l0aW9uIC0gdmlld3BvcnQucGFkZGluZyAtIGNvbnRhaW5lck9mZnNldCArXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGllbnRIZWlnaHQsIDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuaGVhZGVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAndHJhbnNmb3JtJywgYCR7dGhpcy5fdHJhbnNsYXRlRGlyfSgke29mZnNldH1weClgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmhlYWRlckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3dlYmtpdFRyYW5zZm9ybScsIGAke3RoaXMuX3RyYW5zbGF0ZURpcn0oJHtvZmZzZXR9cHgpYCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlRXZlbnRBcmc6IElQYWdlSW5mbyA9IChzdGFydENoYW5nZWQgfHwgZW5kQ2hhbmdlZCkgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXg6IHZpZXdwb3J0LnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIGVuZEluZGV4OiB2aWV3cG9ydC5lbmRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbjogdmlld3BvcnQuc2Nyb2xsU3RhcnRQb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRW5kUG9zaXRpb246IHZpZXdwb3J0LnNjcm9sbEVuZFBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzdGFydEluZGV4V2l0aEJ1ZmZlcjogdmlld3BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIGVuZEluZGV4V2l0aEJ1ZmZlcjogdmlld3BvcnQuZW5kSW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICBtYXhTY3JvbGxQb3NpdGlvbjogdmlld3BvcnQubWF4U2Nyb2xsUG9zaXRpb25cbiAgICAgICAgICAgICAgICB9IDogdW5kZWZpbmVkO1xuXG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRDaGFuZ2VkIHx8IGVuZENoYW5nZWQgfHwgc2Nyb2xsUG9zaXRpb25DaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZUNoYW5nZWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHNjcm9sbCBsaXN0IHRvIHRyaWdnZXIgcmUtcmVuZGVyIG9mIGNvbXBvbmVudHMgaW4gdmlld3BvcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld1BvcnRJdGVtcyA9IHZpZXdwb3J0LnN0YXJ0SW5kZXhXaXRoQnVmZmVyID49IDAgJiYgdmlld3BvcnQuZW5kSW5kZXhXaXRoQnVmZmVyID49IDAgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMuc2xpY2Uodmlld3BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXIsIHZpZXdwb3J0LmVuZEluZGV4V2l0aEJ1ZmZlciArIDEpIDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZzVXBkYXRlLmVtaXQodGhpcy52aWV3UG9ydEl0ZW1zKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0Q2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnNTdGFydC5lbWl0KGNoYW5nZUV2ZW50QXJnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuZENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZzRW5kLmVtaXQoY2hhbmdlRXZlbnRBcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRDaGFuZ2VkIHx8IGVuZENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnNDaGFuZ2UuZW1pdChjaGFuZ2VFdmVudEFyZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXhSdW5UaW1lcyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UsIHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaywgbWF4UnVuVGltZXMgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmV4ZWN1dGVSZWZyZXNoT3V0c2lkZUFuZ3VsYXJab25lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVDaGFuZ2VkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuKGhhbmRsZUNoYW5nZWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1heFJ1blRpbWVzID4gMCAmJiAoc2Nyb2xsTGVuZ3RoQ2hhbmdlZCB8fCBwYWRkaW5nQ2hhbmdlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSwgcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrLCBtYXhSdW5UaW1lcyAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldFNjcm9sbEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cgPyBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fFxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keSA6IHRoaXMucGFyZW50U2Nyb2xsIHx8IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhZGRTY3JvbGxFdmVudEhhbmRsZXJzKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5pc0FuZ3VsYXJVbml2ZXJzYWxTU1IpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcblxuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbEV2ZW50SGFuZGxlcnMoKTtcblxuICAgICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50U2Nyb2xsIGluc3RhbmNlb2YgV2luZG93KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlU2Nyb2xsSGFuZGxlciA9IHRoaXMucmVuZGVyZXIubGlzdGVuKCd3aW5kb3cnLCAnc2Nyb2xsJywgdGhpcy5vblNjcm9sbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlUmVzaXplSGFuZGxlciA9IHRoaXMucmVuZGVyZXIubGlzdGVuKCd3aW5kb3cnLCAncmVzaXplJywgdGhpcy5vblNjcm9sbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVNjcm9sbEhhbmRsZXIgPSB0aGlzLnJlbmRlcmVyLmxpc3RlbihzY3JvbGxFbGVtZW50LCAnc2Nyb2xsJywgdGhpcy5vblNjcm9sbCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NoZWNrUmVzaXplSW50ZXJ2YWwgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZFRpbWVyID0gKHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCB0aGlzLl9jaGVja1Jlc2l6ZUludGVydmFsKSBhcyBhbnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHJlbW92ZVNjcm9sbEV2ZW50SGFuZGxlcnMoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrU2Nyb2xsRWxlbWVudFJlc2l6ZWRUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmNoZWNrU2Nyb2xsRWxlbWVudFJlc2l6ZWRUaW1lcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kaXNwb3NlU2Nyb2xsSGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlU2Nyb2xsSGFuZGxlcigpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlU2Nyb2xsSGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2VSZXNpemVIYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VSZXNpemVIYW5kbGVyKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VSZXNpemVIYW5kbGVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldEVsZW1lbnRzT2Zmc2V0KCk6IG51bWJlciB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5ndWxhclVuaXZlcnNhbFNTUikge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb2Zmc2V0ID0gMDtcblxuICAgICAgICBpZiAodGhpcy5jb250YWluZXJFbGVtZW50UmVmICYmIHRoaXMuY29udGFpbmVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jb250YWluZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnRbdGhpcy5fb2Zmc2V0VHlwZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wYXJlbnRTY3JvbGwpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRDbGllbnRSZWN0ID0gdGhpcy5nZXRFbGVtZW50U2l6ZSh0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCk7XG4gICAgICAgICAgICBjb25zdCBzY3JvbGxDbGllbnRSZWN0ID0gdGhpcy5nZXRFbGVtZW50U2l6ZShzY3JvbGxFbGVtZW50KTtcbiAgICAgICAgICAgIGlmICh0aGlzLmhvcml6b250YWwpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gZWxlbWVudENsaWVudFJlY3QubGVmdCAtIHNjcm9sbENsaWVudFJlY3QubGVmdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGVsZW1lbnRDbGllbnRSZWN0LnRvcCAtIHNjcm9sbENsaWVudFJlY3QudG9wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoISh0aGlzLnBhcmVudFNjcm9sbCBpbnN0YW5jZW9mIFdpbmRvdykpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gc2Nyb2xsRWxlbWVudFt0aGlzLl9zY3JvbGxUeXBlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvZmZzZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGNvdW50SXRlbXNQZXJXcmFwR3JvdXAoKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmd1bGFyVW5pdmVyc2FsU1NSKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmhvcml6b250YWwgPyB0aGlzLnNzclZpZXdwb3J0SGVpZ2h0IC8gdGhpcy5zc3JDaGlsZEhlaWdodCA6IHRoaXMuc3NyVmlld3BvcnRXaWR0aCAvIHRoaXMuc3NyQ2hpbGRXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSB0aGlzLmhvcml6b250YWwgPyAnb2Zmc2V0TGVmdCcgOiAnb2Zmc2V0VG9wJztcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSAoKHRoaXMuY29udGFpbmVyRWxlbWVudFJlZiAmJiB0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCkgfHxcbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCkuY2hpbGRyZW47XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW5MZW5ndGggPSBjaGlsZHJlbiA/IGNoaWxkcmVuLmxlbmd0aCA6IDA7XG4gICAgICAgIGlmIChjaGlsZHJlbkxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaXJzdE9mZnNldCA9IGNoaWxkcmVuWzBdW3Byb3BlcnR5TmFtZV07XG4gICAgICAgIGxldCByZXN1bHQgPSAxO1xuICAgICAgICB3aGlsZSAocmVzdWx0IDwgY2hpbGRyZW5MZW5ndGggJiYgZmlyc3RPZmZzZXQgPT09IGNoaWxkcmVuW3Jlc3VsdF1bcHJvcGVydHlOYW1lXSkge1xuICAgICAgICAgICAgKytyZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRTY3JvbGxTdGFydFBvc2l0aW9uKCk6IG51bWJlciB7XG4gICAgICAgIGxldCB3aW5kb3dTY3JvbGxWYWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGFyZW50U2Nyb2xsIGluc3RhbmNlb2YgV2luZG93KSB7XG4gICAgICAgICAgICB3aW5kb3dTY3JvbGxWYWx1ZSA9IHdpbmRvd1t0aGlzLl9wYWdlT2Zmc2V0VHlwZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2luZG93U2Nyb2xsVmFsdWUgfHwgdGhpcy5nZXRTY3JvbGxFbGVtZW50KClbdGhpcy5fc2Nyb2xsVHlwZV0gfHwgMDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVzZXRXcmFwR3JvdXBEaW1lbnNpb25zKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbGRXcmFwR3JvdXBEaW1lbnNpb25zID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zO1xuICAgICAgICB0aGlzLmludmFsaWRhdGVBbGxDYWNoZWRNZWFzdXJlbWVudHMoKTtcblxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMgfHwgIW9sZFdyYXBHcm91cERpbWVuc2lvbnMgfHwgb2xkV3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcyA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXRlbXNQZXJXcmFwR3JvdXA6IG51bWJlciA9IHRoaXMuY291bnRJdGVtc1BlcldyYXBHcm91cCgpO1xuICAgICAgICBmb3IgKGxldCB3cmFwR3JvdXBJbmRleCA9IDA7IHdyYXBHcm91cEluZGV4IDwgb2xkV3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXAubGVuZ3RoOyArK3dyYXBHcm91cEluZGV4KSB7XG4gICAgICAgICAgICBjb25zdCBvbGRXcmFwR3JvdXBEaW1lbnNpb246IFdyYXBHcm91cERpbWVuc2lvbiA9IG9sZFdyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW3dyYXBHcm91cEluZGV4XTtcbiAgICAgICAgICAgIGlmICghb2xkV3JhcEdyb3VwRGltZW5zaW9uIHx8ICFvbGRXcmFwR3JvdXBEaW1lbnNpb24uaXRlbXMgfHwgIW9sZFdyYXBHcm91cERpbWVuc2lvbi5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9sZFdyYXBHcm91cERpbWVuc2lvbi5pdGVtcy5sZW5ndGggIT09IGl0ZW1zUGVyV3JhcEdyb3VwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgaXRlbXNDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBhcnJheVN0YXJ0SW5kZXggPSBpdGVtc1BlcldyYXBHcm91cCAqIHdyYXBHcm91cEluZGV4O1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtc1BlcldyYXBHcm91cDsgKytpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNvbXBhcmVJdGVtcyhvbGRXcmFwR3JvdXBEaW1lbnNpb24uaXRlbXNbaV0sIHRoaXMuaXRlbXNbYXJyYXlTdGFydEluZGV4ICsgaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpdGVtc0NoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICArK3RoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzICs9IG9sZFdyYXBHcm91cERpbWVuc2lvbi5jaGlsZFdpZHRoIHx8IDA7XG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgKz0gb2xkV3JhcEdyb3VwRGltZW5zaW9uLmNoaWxkSGVpZ2h0IHx8IDA7XG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFt3cmFwR3JvdXBJbmRleF0gPSBvbGRXcmFwR3JvdXBEaW1lbnNpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY2FsY3VsYXRlRGltZW5zaW9ucygpOiBJRGltZW5zaW9ucyB7XG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcblxuICAgICAgICBjb25zdCBtYXhDYWxjdWxhdGVkU2Nyb2xsQmFyU2l6ZSA9IDI1OyAvLyBOb3RlOiBGb3JtdWxhIHRvIGF1dG8tY2FsY3VsYXRlIGRvZXNuJ3Qgd29yayBmb3IgUGFyZW50U2Nyb2xsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICBzbyB3ZSBkZWZhdWx0IHRvIHRoaXMgaWYgbm90IHNldCBieSBjb25zdW1pbmcgYXBwbGljYXRpb25cbiAgICAgICAgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFySGVpZ2h0ID0gTWF0aC5tYXgoTWF0aC5taW4oc2Nyb2xsRWxlbWVudC5vZmZzZXRIZWlnaHQgLSBzY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgIG1heENhbGN1bGF0ZWRTY3JvbGxCYXJTaXplKSwgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFySGVpZ2h0KTtcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFyV2lkdGggPSBNYXRoLm1heChNYXRoLm1pbihzY3JvbGxFbGVtZW50Lm9mZnNldFdpZHRoIC0gc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIG1heENhbGN1bGF0ZWRTY3JvbGxCYXJTaXplKSwgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFyV2lkdGgpO1xuXG4gICAgICAgIGxldCB2aWV3cG9ydFdpZHRoID0gc2Nyb2xsRWxlbWVudC5vZmZzZXRXaWR0aCAtICh0aGlzLnNjcm9sbGJhcldpZHRoIHx8IHRoaXMuY2FsY3VsYXRlZFNjcm9sbGJhcldpZHRoIHx8XG4gICAgICAgICAgICAodGhpcy5ob3Jpem9udGFsID8gMCA6IG1heENhbGN1bGF0ZWRTY3JvbGxCYXJTaXplKSk7XG4gICAgICAgIGxldCB2aWV3cG9ydEhlaWdodCA9IHNjcm9sbEVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gKHRoaXMuc2Nyb2xsYmFySGVpZ2h0IHx8IHRoaXMuY2FsY3VsYXRlZFNjcm9sbGJhckhlaWdodCB8fFxuICAgICAgICAgICAgKHRoaXMuaG9yaXpvbnRhbCA/IG1heENhbGN1bGF0ZWRTY3JvbGxCYXJTaXplIDogMCkpO1xuXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSAodGhpcy5jb250YWluZXJFbGVtZW50UmVmICYmIHRoaXMuY29udGFpbmVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSB8fCB0aGlzLmNvbnRlbnRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgY29uc3QgaXRlbXNQZXJXcmFwR3JvdXAgPSB0aGlzLmNvdW50SXRlbXNQZXJXcmFwR3JvdXAoKTtcbiAgICAgICAgbGV0IHdyYXBHcm91cHNQZXJQYWdlO1xuXG4gICAgICAgIGxldCBkZWZhdWx0Q2hpbGRXaWR0aDtcbiAgICAgICAgbGV0IGRlZmF1bHRDaGlsZEhlaWdodDtcblxuICAgICAgICBpZiAodGhpcy5pc0FuZ3VsYXJVbml2ZXJzYWxTU1IpIHtcbiAgICAgICAgICAgIHZpZXdwb3J0V2lkdGggPSB0aGlzLnNzclZpZXdwb3J0V2lkdGg7XG4gICAgICAgICAgICB2aWV3cG9ydEhlaWdodCA9IHRoaXMuc3NyVmlld3BvcnRIZWlnaHQ7XG4gICAgICAgICAgICBkZWZhdWx0Q2hpbGRXaWR0aCA9IHRoaXMuc3NyQ2hpbGRXaWR0aDtcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZEhlaWdodCA9IHRoaXMuc3NyQ2hpbGRIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBpdGVtc1BlclJvdyA9IE1hdGgubWF4KE1hdGguY2VpbCh2aWV3cG9ydFdpZHRoIC8gZGVmYXVsdENoaWxkV2lkdGgpLCAxKTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zUGVyQ29sID0gTWF0aC5tYXgoTWF0aC5jZWlsKHZpZXdwb3J0SGVpZ2h0IC8gZGVmYXVsdENoaWxkSGVpZ2h0KSwgMSk7XG4gICAgICAgICAgICB3cmFwR3JvdXBzUGVyUGFnZSA9IHRoaXMuaG9yaXpvbnRhbCA/IGl0ZW1zUGVyUm93IDogaXRlbXNQZXJDb2w7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIGlmIChjb250ZW50LmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2hpbGRXaWR0aCB8fCAhdGhpcy5jaGlsZEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoICYmIHZpZXdwb3J0V2lkdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IHZpZXdwb3J0V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgJiYgdmlld3BvcnRIZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB2aWV3cG9ydEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY29udGVudC5jaGlsZHJlblswXTtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGllbnRSZWN0ID0gdGhpcy5nZXRFbGVtZW50U2l6ZShjaGlsZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSBNYXRoLm1pbih0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCwgY2xpZW50UmVjdC53aWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ID0gTWF0aC5taW4odGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0LCBjbGllbnRSZWN0LmhlaWdodCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZFdpZHRoID0gdGhpcy5jaGlsZFdpZHRoIHx8IHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoIHx8IHZpZXdwb3J0V2lkdGg7XG4gICAgICAgICAgICBkZWZhdWx0Q2hpbGRIZWlnaHQgPSB0aGlzLmNoaWxkSGVpZ2h0IHx8IHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCB8fCB2aWV3cG9ydEhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gTWF0aC5tYXgoTWF0aC5jZWlsKHZpZXdwb3J0V2lkdGggLyBkZWZhdWx0Q2hpbGRXaWR0aCksIDEpO1xuICAgICAgICAgICAgY29uc3QgaXRlbXNQZXJDb2wgPSBNYXRoLm1heChNYXRoLmNlaWwodmlld3BvcnRIZWlnaHQgLyBkZWZhdWx0Q2hpbGRIZWlnaHQpLCAxKTtcbiAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlID0gdGhpcy5ob3Jpem9udGFsID8gaXRlbXNQZXJSb3cgOiBpdGVtc1BlckNvbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBzY3JvbGxPZmZzZXQgPSBzY3JvbGxFbGVtZW50W3RoaXMuX3Njcm9sbFR5cGVdIC0gKHRoaXMucHJldmlvdXNWaWV3UG9ydCA/IHRoaXMucHJldmlvdXNWaWV3UG9ydC5wYWRkaW5nIDogMCk7XG5cbiAgICAgICAgICAgIGxldCBhcnJheVN0YXJ0SW5kZXggPSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXIgfHwgMDtcbiAgICAgICAgICAgIGxldCB3cmFwR3JvdXBJbmRleCA9IE1hdGguY2VpbChhcnJheVN0YXJ0SW5kZXggLyBpdGVtc1BlcldyYXBHcm91cCk7XG5cbiAgICAgICAgICAgIGxldCBtYXhXaWR0aEZvcldyYXBHcm91cCA9IDA7XG4gICAgICAgICAgICBsZXQgbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwID0gMDtcbiAgICAgICAgICAgIGxldCBzdW1PZlZpc2libGVNYXhXaWR0aHMgPSAwO1xuICAgICAgICAgICAgbGV0IHN1bU9mVmlzaWJsZU1heEhlaWdodHMgPSAwO1xuICAgICAgICAgICAgd3JhcEdyb3Vwc1BlclBhZ2UgPSAwO1xuXG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cHJlZmVyLWZvci1vZlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50LmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgKythcnJheVN0YXJ0SW5kZXg7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjb250ZW50LmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKGNoaWxkKTtcblxuICAgICAgICAgICAgICAgIG1heFdpZHRoRm9yV3JhcEdyb3VwID0gTWF0aC5tYXgobWF4V2lkdGhGb3JXcmFwR3JvdXAsIGNsaWVudFJlY3Qud2lkdGgpO1xuICAgICAgICAgICAgICAgIG1heEhlaWdodEZvcldyYXBHcm91cCA9IE1hdGgubWF4KG1heEhlaWdodEZvcldyYXBHcm91cCwgY2xpZW50UmVjdC5oZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFycmF5U3RhcnRJbmRleCAlIGl0ZW1zUGVyV3JhcEdyb3VwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFt3cmFwR3JvdXBJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLS10aGlzLndyYXBHcm91cERpbWVuc2lvbnMubnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzIC09IG9sZFZhbHVlLmNoaWxkV2lkdGggfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRIZWlnaHRzIC09IG9sZFZhbHVlLmNoaWxkSGVpZ2h0IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICArK3RoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLml0ZW1zLnNsaWNlKGFycmF5U3RhcnRJbmRleCAtIGl0ZW1zUGVyV3JhcEdyb3VwLCBhcnJheVN0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW3dyYXBHcm91cEluZGV4XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkV2lkdGg6IG1heFdpZHRoRm9yV3JhcEdyb3VwLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRIZWlnaHQ6IG1heEhlaWdodEZvcldyYXBHcm91cCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHMgKz0gbWF4V2lkdGhGb3JXcmFwR3JvdXA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRIZWlnaHRzICs9IG1heEhlaWdodEZvcldyYXBHcm91cDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWF4VmlzaWJsZVdpZHRoRm9yV3JhcEdyb3VwID0gTWF0aC5taW4obWF4V2lkdGhGb3JXcmFwR3JvdXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgodmlld3BvcnRXaWR0aCAtIHN1bU9mVmlzaWJsZU1heFdpZHRocywgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjcm9sbE9mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JvbGxPZmZzZXRUb1JlbW92ZSA9IE1hdGgubWluKHNjcm9sbE9mZnNldCwgbWF4VmlzaWJsZVdpZHRoRm9yV3JhcEdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXAgLT0gc2Nyb2xsT2Zmc2V0VG9SZW1vdmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IHNjcm9sbE9mZnNldFRvUmVtb3ZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1PZlZpc2libGVNYXhXaWR0aHMgKz0gbWF4VmlzaWJsZVdpZHRoRm9yV3JhcEdyb3VwO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heFZpc2libGVXaWR0aEZvcldyYXBHcm91cCA+IDAgJiYgdmlld3BvcnRXaWR0aCA+PSBzdW1PZlZpc2libGVNYXhXaWR0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3dyYXBHcm91cHNQZXJQYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXAgPSBNYXRoLm1pbihtYXhIZWlnaHRGb3JXcmFwR3JvdXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgodmlld3BvcnRIZWlnaHQgLSBzdW1PZlZpc2libGVNYXhIZWlnaHRzLCAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbE9mZnNldFRvUmVtb3ZlID0gTWF0aC5taW4oc2Nyb2xsT2Zmc2V0LCBtYXhWaXNpYmxlSGVpZ2h0Rm9yV3JhcEdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhWaXNpYmxlSGVpZ2h0Rm9yV3JhcEdyb3VwIC09IHNjcm9sbE9mZnNldFRvUmVtb3ZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbE9mZnNldCAtPSBzY3JvbGxPZmZzZXRUb1JlbW92ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cyArPSBtYXhWaXNpYmxlSGVpZ2h0Rm9yV3JhcEdyb3VwO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXAgPiAwICYmIHZpZXdwb3J0SGVpZ2h0ID49IHN1bU9mVmlzaWJsZU1heEhlaWdodHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3dyYXBHcm91cHNQZXJQYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgKyt3cmFwR3JvdXBJbmRleDtcblxuICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aEZvcldyYXBHcm91cCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIG1heEhlaWdodEZvcldyYXBHcm91cCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBhdmVyYWdlQ2hpbGRXaWR0aCA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHMgL1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgIGNvbnN0IGF2ZXJhZ2VDaGlsZEhlaWdodCA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRIZWlnaHRzIC9cbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM7XG4gICAgICAgICAgICBkZWZhdWx0Q2hpbGRXaWR0aCA9IHRoaXMuY2hpbGRXaWR0aCB8fCBhdmVyYWdlQ2hpbGRXaWR0aCB8fCB2aWV3cG9ydFdpZHRoO1xuICAgICAgICAgICAgZGVmYXVsdENoaWxkSGVpZ2h0ID0gdGhpcy5jaGlsZEhlaWdodCB8fCBhdmVyYWdlQ2hpbGRIZWlnaHQgfHwgdmlld3BvcnRIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmhvcml6b250YWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodmlld3BvcnRXaWR0aCA+IHN1bU9mVmlzaWJsZU1heFdpZHRocykge1xuICAgICAgICAgICAgICAgICAgICB3cmFwR3JvdXBzUGVyUGFnZSArPSBNYXRoLmNlaWwoKHZpZXdwb3J0V2lkdGggLSBzdW1PZlZpc2libGVNYXhXaWR0aHMpIC8gZGVmYXVsdENoaWxkV2lkdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHZpZXdwb3J0SGVpZ2h0ID4gc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cykge1xuICAgICAgICAgICAgICAgICAgICB3cmFwR3JvdXBzUGVyUGFnZSArPSBNYXRoLmNlaWwoKHZpZXdwb3J0SGVpZ2h0IC0gc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cykgLyBkZWZhdWx0Q2hpbGRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGl0ZW1Db3VudCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICBjb25zdCBpdGVtc1BlclBhZ2UgPSBpdGVtc1BlcldyYXBHcm91cCAqIHdyYXBHcm91cHNQZXJQYWdlO1xuICAgICAgICBjb25zdCBwYWdlQ291bnRGcmFjdGlvbmFsID0gaXRlbUNvdW50IC8gaXRlbXNQZXJQYWdlO1xuICAgICAgICBjb25zdCBudW1iZXJPZldyYXBHcm91cHMgPSBNYXRoLmNlaWwoaXRlbUNvdW50IC8gaXRlbXNQZXJXcmFwR3JvdXApO1xuXG4gICAgICAgIGxldCBzY3JvbGxMZW5ndGggPSAwO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXAgPSB0aGlzLmhvcml6b250YWwgPyBkZWZhdWx0Q2hpbGRXaWR0aCA6IGRlZmF1bHRDaGlsZEhlaWdodDtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIGxldCBudW1Vbmtub3duQ2hpbGRTaXplcyA9IDA7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mV3JhcEdyb3VwczsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRTaXplID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2ldW3RoaXMuX2NoaWxkU2Nyb2xsRGltXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aCArPSBjaGlsZFNpemU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgKytudW1Vbmtub3duQ2hpbGRTaXplcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjcm9sbExlbmd0aCArPSBNYXRoLnJvdW5kKG51bVVua25vd25DaGlsZFNpemVzICogZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JvbGxMZW5ndGggPSBudW1iZXJPZldyYXBHcm91cHMgKiBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaGVhZGVyRWxlbWVudFJlZikge1xuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IHRoaXMuaGVhZGVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZpZXdwb3J0TGVuZ3RoID0gdGhpcy5ob3Jpem9udGFsID8gdmlld3BvcnRXaWR0aCA6IHZpZXdwb3J0SGVpZ2h0O1xuICAgICAgICBjb25zdCBtYXhTY3JvbGxQb3NpdGlvbiA9IE1hdGgubWF4KHNjcm9sbExlbmd0aCAtIHZpZXdwb3J0TGVuZ3RoLCAwKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2hpbGRIZWlnaHQ6IGRlZmF1bHRDaGlsZEhlaWdodCxcbiAgICAgICAgICAgIGNoaWxkV2lkdGg6IGRlZmF1bHRDaGlsZFdpZHRoLFxuICAgICAgICAgICAgaXRlbUNvdW50LFxuICAgICAgICAgICAgaXRlbXNQZXJQYWdlLFxuICAgICAgICAgICAgaXRlbXNQZXJXcmFwR3JvdXAsXG4gICAgICAgICAgICBtYXhTY3JvbGxQb3NpdGlvbixcbiAgICAgICAgICAgIHBhZ2VDb3VudF9mcmFjdGlvbmFsOiBwYWdlQ291bnRGcmFjdGlvbmFsLFxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoLFxuICAgICAgICAgICAgdmlld3BvcnRMZW5ndGgsXG4gICAgICAgICAgICB3cmFwR3JvdXBzUGVyUGFnZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY2FsY3VsYXRlUGFkZGluZyhhcnJheVN0YXJ0SW5kZXhXaXRoQnVmZmVyOiBudW1iZXIsIGRpbWVuc2lvbnM6IElEaW1lbnNpb25zKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKGRpbWVuc2lvbnMuaXRlbUNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXAgPSBkaW1lbnNpb25zW3RoaXMuX2NoaWxkU2Nyb2xsRGltXTtcbiAgICAgICAgY29uc3Qgc3RhcnRpbmdXcmFwR3JvdXBJbmRleCA9IE1hdGguZmxvb3IoYXJyYXlTdGFydEluZGV4V2l0aEJ1ZmZlciAvIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXApIHx8IDA7XG5cbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCAqIHN0YXJ0aW5nV3JhcEdyb3VwSW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbnVtVW5rbm93bkNoaWxkU2l6ZXMgPSAwO1xuICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGFydGluZ1dyYXBHcm91cEluZGV4OyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkU2l6ZSA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV0gJiZcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2ldW3RoaXMuX2NoaWxkU2Nyb2xsRGltXTtcbiAgICAgICAgICAgIGlmIChjaGlsZFNpemUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gY2hpbGRTaXplO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK251bVVua25vd25DaGlsZFNpemVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSBNYXRoLnJvdW5kKG51bVVua25vd25DaGlsZFNpemVzICogZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY2FsY3VsYXRlUGFnZUluZm8oc2Nyb2xsUG9zaXRpb246IG51bWJlciwgZGltZW5zaW9uczogSURpbWVuc2lvbnMpOiBJUGFnZUluZm8ge1xuICAgICAgICBsZXQgc2Nyb2xsUGVyY2VudGFnZSA9IDA7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKSB7XG4gICAgICAgICAgICBjb25zdCBudW1iZXJPZldyYXBHcm91cHMgPSBNYXRoLmNlaWwoZGltZW5zaW9ucy5pdGVtQ291bnQgLyBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwKTtcbiAgICAgICAgICAgIGxldCB0b3RhbFNjcm9sbGVkTGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXAgPSBkaW1lbnNpb25zW3RoaXMuX2NoaWxkU2Nyb2xsRGltXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZXcmFwR3JvdXBzOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZFNpemUgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2ldICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV1bdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZFNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTY3JvbGxlZExlbmd0aCArPSBjaGlsZFNpemU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTY3JvbGxlZExlbmd0aCArPSBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxQb3NpdGlvbiA8IHRvdGFsU2Nyb2xsZWRMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUGVyY2VudGFnZSA9IGkgLyBudW1iZXJPZldyYXBHcm91cHM7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcm9sbFBlcmNlbnRhZ2UgPSBzY3JvbGxQb3NpdGlvbiAvIGRpbWVuc2lvbnMuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhcnRpbmdBcnJheUluZGV4RnJhY3Rpb25hbCA9IE1hdGgubWluKE1hdGgubWF4KHNjcm9sbFBlcmNlbnRhZ2UgKiBkaW1lbnNpb25zLnBhZ2VDb3VudF9mcmFjdGlvbmFsLCAwKSxcbiAgICAgICAgICAgIGRpbWVuc2lvbnMucGFnZUNvdW50X2ZyYWN0aW9uYWwpICogZGltZW5zaW9ucy5pdGVtc1BlclBhZ2U7XG5cbiAgICAgICAgY29uc3QgbWF4U3RhcnQgPSBkaW1lbnNpb25zLml0ZW1Db3VudCAtIGRpbWVuc2lvbnMuaXRlbXNQZXJQYWdlIC0gMTtcbiAgICAgICAgbGV0IGFycmF5U3RhcnRJbmRleCA9IE1hdGgubWluKE1hdGguZmxvb3Ioc3RhcnRpbmdBcnJheUluZGV4RnJhY3Rpb25hbCksIG1heFN0YXJ0KTtcbiAgICAgICAgYXJyYXlTdGFydEluZGV4IC09IGFycmF5U3RhcnRJbmRleCAlIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXA7IC8vIHJvdW5kIGRvd24gdG8gc3RhcnQgb2Ygd3JhcEdyb3VwXG5cbiAgICAgICAgaWYgKHRoaXMuc3RyaXBlZFRhYmxlKSB7XG4gICAgICAgICAgICBjb25zdCBidWZmZXJCb3VuZGFyeSA9IDIgKiBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwO1xuICAgICAgICAgICAgaWYgKGFycmF5U3RhcnRJbmRleCAlIGJ1ZmZlckJvdW5kYXJ5ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgYXJyYXlTdGFydEluZGV4ID0gTWF0aC5tYXgoYXJyYXlTdGFydEluZGV4IC0gYXJyYXlTdGFydEluZGV4ICUgYnVmZmVyQm91bmRhcnksIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGFycmF5RW5kSW5kZXggPSBNYXRoLmNlaWwoc3RhcnRpbmdBcnJheUluZGV4RnJhY3Rpb25hbCkgKyBkaW1lbnNpb25zLml0ZW1zUGVyUGFnZSAtIDE7XG4gICAgICAgIGNvbnN0IGVuZEluZGV4V2l0aGluV3JhcEdyb3VwID0gKGFycmF5RW5kSW5kZXggKyAxKSAlIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXA7XG4gICAgICAgIGlmIChlbmRJbmRleFdpdGhpbldyYXBHcm91cCA+IDApIHtcbiAgICAgICAgICAgIGFycmF5RW5kSW5kZXggKz0gZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cCAtIGVuZEluZGV4V2l0aGluV3JhcEdyb3VwOyAvLyByb3VuZCB1cCB0byBlbmQgb2Ygd3JhcEdyb3VwXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNOYU4oYXJyYXlTdGFydEluZGV4KSkge1xuICAgICAgICAgICAgYXJyYXlTdGFydEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNOYU4oYXJyYXlFbmRJbmRleCkpIHtcbiAgICAgICAgICAgIGFycmF5RW5kSW5kZXggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXlTdGFydEluZGV4ID0gTWF0aC5taW4oTWF0aC5tYXgoYXJyYXlTdGFydEluZGV4LCAwKSwgZGltZW5zaW9ucy5pdGVtQ291bnQgLSAxKTtcbiAgICAgICAgYXJyYXlFbmRJbmRleCA9IE1hdGgubWluKE1hdGgubWF4KGFycmF5RW5kSW5kZXgsIDApLCBkaW1lbnNpb25zLml0ZW1Db3VudCAtIDEpO1xuXG4gICAgICAgIGNvbnN0IGJ1ZmZlclNpemUgPSB0aGlzLmJ1ZmZlckFtb3VudCAqIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXA7XG4gICAgICAgIGNvbnN0IHN0YXJ0SW5kZXhXaXRoQnVmZmVyID0gTWF0aC5taW4oTWF0aC5tYXgoYXJyYXlTdGFydEluZGV4IC0gYnVmZmVyU2l6ZSwgMCksIGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gMSk7XG4gICAgICAgIGNvbnN0IGVuZEluZGV4V2l0aEJ1ZmZlciA9IE1hdGgubWluKE1hdGgubWF4KGFycmF5RW5kSW5kZXggKyBidWZmZXJTaXplLCAwKSwgZGltZW5zaW9ucy5pdGVtQ291bnQgLSAxKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhcnRJbmRleDogYXJyYXlTdGFydEluZGV4LFxuICAgICAgICAgICAgZW5kSW5kZXg6IGFycmF5RW5kSW5kZXgsXG4gICAgICAgICAgICBzdGFydEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgIGVuZEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb246IHNjcm9sbFBvc2l0aW9uLFxuICAgICAgICAgICAgc2Nyb2xsRW5kUG9zaXRpb246IHNjcm9sbFBvc2l0aW9uICsgZGltZW5zaW9ucy52aWV3cG9ydExlbmd0aCxcbiAgICAgICAgICAgIG1heFNjcm9sbFBvc2l0aW9uOiBkaW1lbnNpb25zLm1heFNjcm9sbFBvc2l0aW9uXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZVZpZXdwb3J0KCk6IElWaWV3cG9ydCB7XG4gICAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSB0aGlzLmNhbGN1bGF0ZURpbWVuc2lvbnMoKTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5nZXRFbGVtZW50c09mZnNldCgpO1xuXG4gICAgICAgIGxldCBzY3JvbGxTdGFydFBvc2l0aW9uID0gdGhpcy5nZXRTY3JvbGxTdGFydFBvc2l0aW9uKCk7XG4gICAgICAgIGlmIChzY3JvbGxTdGFydFBvc2l0aW9uID4gKGRpbWVuc2lvbnMuc2Nyb2xsTGVuZ3RoICsgb2Zmc2V0KSAmJiAhKHRoaXMucGFyZW50U2Nyb2xsIGluc3RhbmNlb2YgV2luZG93KSkge1xuICAgICAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbiA9IGRpbWVuc2lvbnMuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbiAtPSBvZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbiA9IE1hdGgubWF4KDAsIHNjcm9sbFN0YXJ0UG9zaXRpb24pO1xuXG4gICAgICAgIGNvbnN0IHBhZ2VJbmZvID0gdGhpcy5jYWxjdWxhdGVQYWdlSW5mbyhzY3JvbGxTdGFydFBvc2l0aW9uLCBkaW1lbnNpb25zKTtcbiAgICAgICAgY29uc3QgbmV3UGFkZGluZyA9IHRoaXMuY2FsY3VsYXRlUGFkZGluZyhwYWdlSW5mby5zdGFydEluZGV4V2l0aEJ1ZmZlciwgZGltZW5zaW9ucyk7XG4gICAgICAgIGNvbnN0IG5ld1Njcm9sbExlbmd0aCA9IGRpbWVuc2lvbnMuc2Nyb2xsTGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydEluZGV4OiBwYWdlSW5mby5zdGFydEluZGV4LFxuICAgICAgICAgICAgZW5kSW5kZXg6IHBhZ2VJbmZvLmVuZEluZGV4LFxuICAgICAgICAgICAgc3RhcnRJbmRleFdpdGhCdWZmZXI6IHBhZ2VJbmZvLnN0YXJ0SW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgZW5kSW5kZXhXaXRoQnVmZmVyOiBwYWdlSW5mby5lbmRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICBwYWRkaW5nOiBNYXRoLnJvdW5kKG5ld1BhZGRpbmcpLFxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBNYXRoLnJvdW5kKG5ld1Njcm9sbExlbmd0aCksXG4gICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uOiBwYWdlSW5mby5zY3JvbGxTdGFydFBvc2l0aW9uLFxuICAgICAgICAgICAgc2Nyb2xsRW5kUG9zaXRpb246IHBhZ2VJbmZvLnNjcm9sbEVuZFBvc2l0aW9uLFxuICAgICAgICAgICAgbWF4U2Nyb2xsUG9zaXRpb246IHBhZ2VJbmZvLm1heFNjcm9sbFBvc2l0aW9uXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5ATmdNb2R1bGUoe1xuICAgIGV4cG9ydHM6IFtWaXJ0dWFsU2Nyb2xsZXJDb21wb25lbnRdLFxuICAgIGRlY2xhcmF0aW9uczogW1ZpcnR1YWxTY3JvbGxlckNvbXBvbmVudF0sXG4gICAgaW1wb3J0czogW0NvbW1vbk1vZHVsZV0sXG4gICAgcHJvdmlkZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIHByb3ZpZGU6ICd2aXJ0dWFsLXNjcm9sbGVyLWRlZmF1bHQtb3B0aW9ucycsXG4gICAgICAgICAgICB1c2VGYWN0b3J5OiBWSVJUVUFMX1NDUk9MTEVSX0RFRkFVTFRfT1BUSU9OU19GQUNUT1JZXG4gICAgICAgIH1cbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIFZpcnR1YWxTY3JvbGxlck1vZHVsZSB7XG59XG4iXX0=