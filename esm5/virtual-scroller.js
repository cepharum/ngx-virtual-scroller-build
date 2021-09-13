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
var VirtualScrollerComponent = /** @class */ (function () {
    function VirtualScrollerComponent(element, renderer, zone, changeDetectorRef, 
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
        this.compareItems = function (item1, item2) { return item1 === item2; };
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
    Object.defineProperty(VirtualScrollerComponent.prototype, "viewPortInfo", {
        get: function () {
            var pageInfo = this.previousViewPort || {};
            return {
                startIndex: pageInfo.startIndex || 0,
                endIndex: pageInfo.endIndex || 0,
                scrollStartPosition: pageInfo.scrollStartPosition || 0,
                scrollEndPosition: pageInfo.scrollEndPosition || 0,
                maxScrollPosition: pageInfo.maxScrollPosition || 0,
                startIndexWithBuffer: pageInfo.startIndexWithBuffer || 0,
                endIndexWithBuffer: pageInfo.endIndexWithBuffer || 0
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "enableUnequalChildrenSizes", {
        get: function () {
            return this._enableUnequalChildrenSizes;
        },
        set: function (value) {
            if (this._enableUnequalChildrenSizes === value) {
                return;
            }
            this._enableUnequalChildrenSizes = value;
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "bufferAmount", {
        get: function () {
            if (typeof (this._bufferAmount) === 'number' && this._bufferAmount >= 0) {
                return this._bufferAmount;
            }
            else {
                return this.enableUnequalChildrenSizes ? 5 : 0;
            }
        },
        set: function (value) {
            this._bufferAmount = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "scrollThrottlingTime", {
        get: function () {
            return this._scrollThrottlingTime;
        },
        set: function (value) {
            this._scrollThrottlingTime = value;
            this.updateOnScrollFunction();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "scrollDebounceTime", {
        get: function () {
            return this._scrollDebounceTime;
        },
        set: function (value) {
            this._scrollDebounceTime = value;
            this.updateOnScrollFunction();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "checkResizeInterval", {
        get: function () {
            return this._checkResizeInterval;
        },
        set: function (value) {
            if (this._checkResizeInterval === value) {
                return;
            }
            this._checkResizeInterval = value;
            this.addScrollEventHandlers();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "items", {
        get: function () {
            return this._items;
        },
        set: function (value) {
            if (value === this._items) {
                return;
            }
            this._items = value || [];
            this.refresh_internal(true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "horizontal", {
        get: function () {
            return this._horizontal;
        },
        set: function (value) {
            this._horizontal = value;
            this.updateDirection();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "parentScroll", {
        get: function () {
            return this._parentScroll;
        },
        set: function (value) {
            if (this._parentScroll === value) {
                return;
            }
            this.revertParentOverscroll();
            this._parentScroll = value;
            this.addScrollEventHandlers();
            var scrollElement = this.getScrollElement();
            if (this.modifyOverflowStyleOfParentScroll && scrollElement !== this.element.nativeElement) {
                this.oldParentScrollOverflow = { x: scrollElement.style['overflow-x'], y: scrollElement.style['overflow-y'] };
                scrollElement.style['overflow-y'] = this.horizontal ? 'visible' : 'auto';
                scrollElement.style['overflow-x'] = this.horizontal ? 'auto' : 'visible';
            }
        },
        enumerable: true,
        configurable: true
    });
    VirtualScrollerComponent.prototype.updateOnScrollFunction = function () {
        var _this_1 = this;
        if (this.scrollDebounceTime) {
            this.onScroll = this.debounce(function () {
                _this_1.refresh_internal(false);
            }, this.scrollDebounceTime);
        }
        else if (this.scrollThrottlingTime) {
            this.onScroll = this.throttleTrailing(function () {
                _this_1.refresh_internal(false);
            }, this.scrollThrottlingTime);
        }
        else {
            this.onScroll = function () {
                _this_1.refresh_internal(false);
            };
        }
    };
    VirtualScrollerComponent.prototype.revertParentOverscroll = function () {
        var scrollElement = this.getScrollElement();
        if (scrollElement && this.oldParentScrollOverflow) {
            scrollElement.style['overflow-y'] = this.oldParentScrollOverflow.y;
            scrollElement.style['overflow-x'] = this.oldParentScrollOverflow.x;
        }
        this.oldParentScrollOverflow = undefined;
    };
    VirtualScrollerComponent.prototype.ngOnInit = function () {
        this.addScrollEventHandlers();
    };
    VirtualScrollerComponent.prototype.ngOnDestroy = function () {
        this.removeScrollEventHandlers();
        this.revertParentOverscroll();
    };
    VirtualScrollerComponent.prototype.ngOnChanges = function (changes) {
        var indexLengthChanged = this.cachedItemsLength !== this.items.length;
        this.cachedItemsLength = this.items.length;
        var firstRun = !changes.items || !changes.items.previousValue || changes.items.previousValue.length === 0;
        this.refresh_internal(indexLengthChanged || firstRun);
    };
    VirtualScrollerComponent.prototype.ngDoCheck = function () {
        if (this.cachedItemsLength !== this.items.length) {
            this.cachedItemsLength = this.items.length;
            this.refresh_internal(true);
            return;
        }
        if (this.previousViewPort && this.viewPortItems && this.viewPortItems.length > 0) {
            var itemsArrayChanged = false;
            for (var i = 0; i < this.viewPortItems.length; ++i) {
                if (!this.compareItems(this.items[this.previousViewPort.startIndexWithBuffer + i], this.viewPortItems[i])) {
                    itemsArrayChanged = true;
                    break;
                }
            }
            if (itemsArrayChanged) {
                this.refresh_internal(true);
            }
        }
    };
    VirtualScrollerComponent.prototype.refresh = function () {
        this.refresh_internal(true);
    };
    VirtualScrollerComponent.prototype.invalidateAllCachedMeasurements = function () {
        this.wrapGroupDimensions = {
            maxChildSizePerWrapGroup: [],
            numberOfKnownWrapGroupChildSizes: 0,
            sumOfKnownWrapGroupChildWidths: 0,
            sumOfKnownWrapGroupChildHeights: 0
        };
        this.minMeasuredChildWidth = undefined;
        this.minMeasuredChildHeight = undefined;
        this.refresh_internal(false);
    };
    VirtualScrollerComponent.prototype.invalidateCachedMeasurementForItem = function (item) {
        if (this.enableUnequalChildrenSizes) {
            var index = this.items && this.items.indexOf(item);
            if (index >= 0) {
                this.invalidateCachedMeasurementAtIndex(index);
            }
        }
        else {
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        }
        this.refresh_internal(false);
    };
    VirtualScrollerComponent.prototype.invalidateCachedMeasurementAtIndex = function (index) {
        if (this.enableUnequalChildrenSizes) {
            var cachedMeasurement = this.wrapGroupDimensions.maxChildSizePerWrapGroup[index];
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
    };
    VirtualScrollerComponent.prototype.scrollInto = function (item, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        var index = this.items.indexOf(item);
        if (index === -1) {
            return;
        }
        this.scrollToIndex(index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback);
    };
    VirtualScrollerComponent.prototype.scrollToIndex = function (index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        var _this_1 = this;
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        var maxRetries = 5;
        var retryIfNeeded = function () {
            --maxRetries;
            if (maxRetries <= 0) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            var dimensions = _this_1.calculateDimensions();
            var desiredStartIndex = Math.min(Math.max(index, 0), dimensions.itemCount - 1);
            if (_this_1.previousViewPort.startIndex === desiredStartIndex) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            _this_1.scrollToIndex_internal(index, alignToBeginning, additionalOffset, 0, retryIfNeeded);
        };
        this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, animationMilliseconds, retryIfNeeded);
    };
    VirtualScrollerComponent.prototype.scrollToIndex_internal = function (index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        var dimensions = this.calculateDimensions();
        var scroll = this.calculatePadding(index, dimensions) + additionalOffset;
        if (!alignToBeginning) {
            scroll -= dimensions.wrapGroupsPerPage * dimensions[this._childScrollDim];
        }
        this.scrollToPosition(scroll, animationMilliseconds, animationCompletedCallback);
    };
    VirtualScrollerComponent.prototype.scrollToPosition = function (scrollPosition, animationMilliseconds, animationCompletedCallback) {
        var _this_1 = this;
        scrollPosition += this.getElementsOffset();
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        var scrollElement = this.getScrollElement();
        var animationRequest;
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = undefined;
        }
        if (!animationMilliseconds) {
            this.renderer.setProperty(scrollElement, this._scrollType, scrollPosition);
            this.refresh_internal(false, animationCompletedCallback);
            return;
        }
        var tweenConfigObj = { scrollPosition: scrollElement[this._scrollType] };
        var newTween = new tween.Tween(tweenConfigObj)
            .to({ scrollPosition: scrollPosition }, animationMilliseconds)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate(function (data) {
            if (isNaN(data.scrollPosition)) {
                return;
            }
            _this_1.renderer.setProperty(scrollElement, _this_1._scrollType, data.scrollPosition);
            _this_1.refresh_internal(false);
        })
            .onStop(function () {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        var animate = function (time) {
            if (!newTween.isPlaying()) {
                return;
            }
            newTween.update(time);
            if (tweenConfigObj.scrollPosition === scrollPosition) {
                _this_1.refresh_internal(false, animationCompletedCallback);
                return;
            }
            _this_1.zone.runOutsideAngular(function () {
                animationRequest = requestAnimationFrame(animate);
            });
        };
        animate();
        this.currentTween = newTween;
    };
    VirtualScrollerComponent.prototype.getElementSize = function (element) {
        var result = element.getBoundingClientRect();
        var styles = getComputedStyle(element);
        var marginTop = parseInt(styles['margin-top'], 10) || 0;
        var marginBottom = parseInt(styles['margin-bottom'], 10) || 0;
        var marginLeft = parseInt(styles['margin-left'], 10) || 0;
        var marginRight = parseInt(styles['margin-right'], 10) || 0;
        return {
            top: result.top + marginTop,
            bottom: result.bottom + marginBottom,
            left: result.left + marginLeft,
            right: result.right + marginRight,
            width: result.width + marginLeft + marginRight,
            height: result.height + marginTop + marginBottom
        };
    };
    VirtualScrollerComponent.prototype.checkScrollElementResized = function () {
        var boundingRect = this.getElementSize(this.getScrollElement());
        var sizeChanged;
        if (!this.previousScrollBoundingRect) {
            sizeChanged = true;
        }
        else {
            var widthChange = Math.abs(boundingRect.width - this.previousScrollBoundingRect.width);
            var heightChange = Math.abs(boundingRect.height - this.previousScrollBoundingRect.height);
            sizeChanged = widthChange > this.resizeBypassRefreshThreshold || heightChange > this.resizeBypassRefreshThreshold;
        }
        if (sizeChanged) {
            this.previousScrollBoundingRect = boundingRect;
            if (boundingRect.width > 0 && boundingRect.height > 0) {
                this.refresh_internal(false);
            }
        }
    };
    VirtualScrollerComponent.prototype.updateDirection = function () {
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
    };
    VirtualScrollerComponent.prototype.debounce = function (func, wait) {
        var throttled = this.throttleTrailing(func, wait);
        var result = function () {
            throttled.cancel();
            throttled.apply(this, arguments);
        };
        result.cancel = function () {
            throttled.cancel();
        };
        return result;
    };
    VirtualScrollerComponent.prototype.throttleTrailing = function (func, wait) {
        var timeout;
        var _arguments = arguments;
        var result = function () {
            var _this = this;
            _arguments = arguments;
            if (timeout) {
                return;
            }
            if (wait <= 0) {
                func.apply(_this, _arguments);
            }
            else {
                timeout = setTimeout(function () {
                    timeout = undefined;
                    func.apply(_this, _arguments);
                }, wait);
            }
        };
        result.cancel = function () {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
        };
        return result;
    };
    VirtualScrollerComponent.prototype.refresh_internal = function (itemsArrayModified, refreshCompletedCallback, maxRunTimes) {
        // note: maxRunTimes is to force it to keep recalculating if the previous iteration caused a re-render
        //       (different sliced items in viewport or scrollPosition changed).
        // The default of 2x max will probably be accurate enough without causing too large a performance bottleneck
        // The code would typically quit out on the 2nd iteration anyways. The main time it'd think more than 2 runs
        // would be necessary would be for vastly different sized child items or if this is the 1st time the items array
        // was initialized.
        // Without maxRunTimes, If the user is actively scrolling this code would become an infinite loop until they
        // stopped scrolling. This would be okay, except each scroll event would start an additional infinite loop. We
        // want to short-circuit it to prevent this.
        var _this_1 = this;
        if (maxRunTimes === void 0) { maxRunTimes = 2; }
        if (itemsArrayModified && this.previousViewPort && this.previousViewPort.scrollStartPosition > 0) {
            // if items were prepended, scroll forward to keep same items visible
            var oldViewPort_1 = this.previousViewPort;
            var oldViewPortItems_1 = this.viewPortItems;
            var oldRefreshCompletedCallback_1 = refreshCompletedCallback;
            refreshCompletedCallback = function () {
                var scrollLengthDelta = _this_1.previousViewPort.scrollLength - oldViewPort_1.scrollLength;
                if (scrollLengthDelta > 0 && _this_1.viewPortItems) {
                    var offset = _this_1.previousViewPort.startIndex - _this_1.previousViewPort.startIndexWithBuffer;
                    var oldStartItem = oldViewPortItems_1[offset];
                    var oldStartItemIndex = -1;
                    for (var i = 0, l = _this_1.items, n = _this_1.items.length; i < n; i++) {
                        if (_this_1.compareItems(oldStartItem, l[i])) {
                            oldStartItemIndex = i;
                            break;
                        }
                    }
                    if (oldStartItemIndex > _this_1.previousViewPort.startIndex) {
                        var itemOrderChanged = false;
                        for (var i = 1, l = _this_1.viewPortItems.length - offset; i < l; ++i) {
                            if (!_this_1.compareItems(_this_1.items[oldStartItemIndex + i], oldViewPortItems_1[offset + i])) {
                                itemOrderChanged = true;
                                break;
                            }
                        }
                        if (!itemOrderChanged) {
                            _this_1.scrollToPosition(_this_1.previousViewPort.scrollStartPosition + scrollLengthDelta, 0, oldRefreshCompletedCallback_1);
                            return;
                        }
                    }
                }
                if (oldRefreshCompletedCallback_1) {
                    oldRefreshCompletedCallback_1();
                }
            };
        }
        this.zone.runOutsideAngular(function () {
            requestAnimationFrame(function () {
                if (itemsArrayModified) {
                    _this_1.resetWrapGroupDimensions();
                }
                var viewport = _this_1.calculateViewport();
                var startChanged = itemsArrayModified || viewport.startIndex !== _this_1.previousViewPort.startIndex;
                var endChanged = itemsArrayModified || viewport.endIndex !== _this_1.previousViewPort.endIndex;
                var scrollLengthChanged = viewport.scrollLength !== _this_1.previousViewPort.scrollLength;
                var paddingChanged = viewport.padding !== _this_1.previousViewPort.padding;
                var scrollPositionChanged = viewport.scrollStartPosition !== _this_1.previousViewPort.scrollStartPosition ||
                    viewport.scrollEndPosition !== _this_1.previousViewPort.scrollEndPosition ||
                    viewport.maxScrollPosition !== _this_1.previousViewPort.maxScrollPosition;
                _this_1.previousViewPort = viewport;
                if (scrollLengthChanged) {
                    _this_1.renderer.setStyle(_this_1.invisiblePaddingElementRef.nativeElement, 'transform', _this_1._invisiblePaddingProperty + "(" + viewport.scrollLength + ")");
                    _this_1.renderer.setStyle(_this_1.invisiblePaddingElementRef.nativeElement, 'webkitTransform', _this_1._invisiblePaddingProperty + "(" + viewport.scrollLength + ")");
                }
                if (paddingChanged) {
                    if (_this_1.useMarginInsteadOfTranslate) {
                        _this_1.renderer.setStyle(_this_1.contentElementRef.nativeElement, _this_1._marginDir, viewport.padding + "px");
                    }
                    else {
                        _this_1.renderer.setStyle(_this_1.contentElementRef.nativeElement, 'transform', _this_1._translateDir + "(" + viewport.padding + "px)");
                        _this_1.renderer.setStyle(_this_1.contentElementRef.nativeElement, 'webkitTransform', _this_1._translateDir + "(" + viewport.padding + "px)");
                    }
                }
                if (_this_1.headerElementRef) {
                    var scrollPosition = _this_1.getScrollElement()[_this_1._scrollType];
                    var containerOffset = _this_1.getElementsOffset();
                    var offset = Math.max(scrollPosition - viewport.padding - containerOffset +
                        _this_1.headerElementRef.nativeElement.clientHeight, 0);
                    _this_1.renderer.setStyle(_this_1.headerElementRef.nativeElement, 'transform', _this_1._translateDir + "(" + offset + "px)");
                    _this_1.renderer.setStyle(_this_1.headerElementRef.nativeElement, 'webkitTransform', _this_1._translateDir + "(" + offset + "px)");
                }
                var changeEventArg = (startChanged || endChanged) ? {
                    startIndex: viewport.startIndex,
                    endIndex: viewport.endIndex,
                    scrollStartPosition: viewport.scrollStartPosition,
                    scrollEndPosition: viewport.scrollEndPosition,
                    startIndexWithBuffer: viewport.startIndexWithBuffer,
                    endIndexWithBuffer: viewport.endIndexWithBuffer,
                    maxScrollPosition: viewport.maxScrollPosition
                } : undefined;
                if (startChanged || endChanged || scrollPositionChanged) {
                    var handleChanged = function () {
                        // update the scroll list to trigger re-render of components in viewport
                        _this_1.viewPortItems = viewport.startIndexWithBuffer >= 0 && viewport.endIndexWithBuffer >= 0 ?
                            _this_1.items.slice(viewport.startIndexWithBuffer, viewport.endIndexWithBuffer + 1) : [];
                        _this_1.vsUpdate.emit(_this_1.viewPortItems);
                        if (startChanged) {
                            _this_1.vsStart.emit(changeEventArg);
                        }
                        if (endChanged) {
                            _this_1.vsEnd.emit(changeEventArg);
                        }
                        if (startChanged || endChanged) {
                            _this_1.changeDetectorRef.markForCheck();
                            _this_1.vsChange.emit(changeEventArg);
                        }
                        if (maxRunTimes > 0) {
                            _this_1.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                            return;
                        }
                        if (refreshCompletedCallback) {
                            refreshCompletedCallback();
                        }
                    };
                    if (_this_1.executeRefreshOutsideAngularZone) {
                        handleChanged();
                    }
                    else {
                        _this_1.zone.run(handleChanged);
                    }
                }
                else {
                    if (maxRunTimes > 0 && (scrollLengthChanged || paddingChanged)) {
                        _this_1.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                        return;
                    }
                    if (refreshCompletedCallback) {
                        refreshCompletedCallback();
                    }
                }
            });
        });
    };
    VirtualScrollerComponent.prototype.getScrollElement = function () {
        return this.parentScroll instanceof Window ? document.scrollingElement || document.documentElement ||
            document.body : this.parentScroll || this.element.nativeElement;
    };
    VirtualScrollerComponent.prototype.addScrollEventHandlers = function () {
        var _this_1 = this;
        if (this.isAngularUniversalSSR) {
            return;
        }
        var scrollElement = this.getScrollElement();
        this.removeScrollEventHandlers();
        this.zone.runOutsideAngular(function () {
            if (_this_1.parentScroll instanceof Window) {
                _this_1.disposeScrollHandler = _this_1.renderer.listen('window', 'scroll', _this_1.onScroll);
                _this_1.disposeResizeHandler = _this_1.renderer.listen('window', 'resize', _this_1.onScroll);
            }
            else {
                _this_1.disposeScrollHandler = _this_1.renderer.listen(scrollElement, 'scroll', _this_1.onScroll);
                if (_this_1._checkResizeInterval > 0) {
                    _this_1.checkScrollElementResizedTimer = setInterval(function () {
                        _this_1.checkScrollElementResized();
                    }, _this_1._checkResizeInterval);
                }
            }
        });
    };
    VirtualScrollerComponent.prototype.removeScrollEventHandlers = function () {
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
    };
    VirtualScrollerComponent.prototype.getElementsOffset = function () {
        if (this.isAngularUniversalSSR) {
            return 0;
        }
        var offset = 0;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            offset += this.containerElementRef.nativeElement[this._offsetType];
        }
        if (this.parentScroll) {
            var scrollElement = this.getScrollElement();
            var elementClientRect = this.getElementSize(this.element.nativeElement);
            var scrollClientRect = this.getElementSize(scrollElement);
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
    };
    VirtualScrollerComponent.prototype.countItemsPerWrapGroup = function () {
        if (this.isAngularUniversalSSR) {
            return Math.round(this.horizontal ? this.ssrViewportHeight / this.ssrChildHeight : this.ssrViewportWidth / this.ssrChildWidth);
        }
        var propertyName = this.horizontal ? 'offsetLeft' : 'offsetTop';
        var children = ((this.containerElementRef && this.containerElementRef.nativeElement) ||
            this.contentElementRef.nativeElement).children;
        var childrenLength = children ? children.length : 0;
        if (childrenLength === 0) {
            return 1;
        }
        var firstOffset = children[0][propertyName];
        var result = 1;
        while (result < childrenLength && firstOffset === children[result][propertyName]) {
            ++result;
        }
        return result;
    };
    VirtualScrollerComponent.prototype.getScrollStartPosition = function () {
        var windowScrollValue;
        if (this.parentScroll instanceof Window) {
            windowScrollValue = window[this._pageOffsetType];
        }
        return windowScrollValue || this.getScrollElement()[this._scrollType] || 0;
    };
    VirtualScrollerComponent.prototype.resetWrapGroupDimensions = function () {
        var oldWrapGroupDimensions = this.wrapGroupDimensions;
        this.invalidateAllCachedMeasurements();
        if (!this.enableUnequalChildrenSizes || !oldWrapGroupDimensions || oldWrapGroupDimensions.numberOfKnownWrapGroupChildSizes === 0) {
            return;
        }
        var itemsPerWrapGroup = this.countItemsPerWrapGroup();
        for (var wrapGroupIndex = 0; wrapGroupIndex < oldWrapGroupDimensions.maxChildSizePerWrapGroup.length; ++wrapGroupIndex) {
            var oldWrapGroupDimension = oldWrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
            if (!oldWrapGroupDimension || !oldWrapGroupDimension.items || !oldWrapGroupDimension.items.length) {
                continue;
            }
            if (oldWrapGroupDimension.items.length !== itemsPerWrapGroup) {
                return;
            }
            var itemsChanged = false;
            var arrayStartIndex = itemsPerWrapGroup * wrapGroupIndex;
            for (var i = 0; i < itemsPerWrapGroup; ++i) {
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
    };
    VirtualScrollerComponent.prototype.calculateDimensions = function () {
        var scrollElement = this.getScrollElement();
        var maxCalculatedScrollBarSize = 25; // Note: Formula to auto-calculate doesn't work for ParentScroll,
        //       so we default to this if not set by consuming application
        this.calculatedScrollbarHeight = Math.max(Math.min(scrollElement.offsetHeight - scrollElement.clientHeight, maxCalculatedScrollBarSize), this.calculatedScrollbarHeight);
        this.calculatedScrollbarWidth = Math.max(Math.min(scrollElement.offsetWidth - scrollElement.clientWidth, maxCalculatedScrollBarSize), this.calculatedScrollbarWidth);
        var viewportWidth = scrollElement.offsetWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth ||
            (this.horizontal ? 0 : maxCalculatedScrollBarSize));
        var viewportHeight = scrollElement.offsetHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight ||
            (this.horizontal ? maxCalculatedScrollBarSize : 0));
        var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        var itemsPerWrapGroup = this.countItemsPerWrapGroup();
        var wrapGroupsPerPage;
        var defaultChildWidth;
        var defaultChildHeight;
        if (this.isAngularUniversalSSR) {
            viewportWidth = this.ssrViewportWidth;
            viewportHeight = this.ssrViewportHeight;
            defaultChildWidth = this.ssrChildWidth;
            defaultChildHeight = this.ssrChildHeight;
            var itemsPerRow = Math.max(Math.ceil(viewportWidth / defaultChildWidth), 1);
            var itemsPerCol = Math.max(Math.ceil(viewportHeight / defaultChildHeight), 1);
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
                var child = content.children[0];
                var clientRect = this.getElementSize(child);
                this.minMeasuredChildWidth = Math.min(this.minMeasuredChildWidth, clientRect.width);
                this.minMeasuredChildHeight = Math.min(this.minMeasuredChildHeight, clientRect.height);
            }
            defaultChildWidth = this.childWidth || this.minMeasuredChildWidth || viewportWidth;
            defaultChildHeight = this.childHeight || this.minMeasuredChildHeight || viewportHeight;
            var itemsPerRow = Math.max(Math.ceil(viewportWidth / defaultChildWidth), 1);
            var itemsPerCol = Math.max(Math.ceil(viewportHeight / defaultChildHeight), 1);
            wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
        }
        else {
            var scrollOffset = scrollElement[this._scrollType] - (this.previousViewPort ? this.previousViewPort.padding : 0);
            var arrayStartIndex = this.previousViewPort.startIndexWithBuffer || 0;
            var wrapGroupIndex = Math.ceil(arrayStartIndex / itemsPerWrapGroup);
            var maxWidthForWrapGroup = 0;
            var maxHeightForWrapGroup = 0;
            var sumOfVisibleMaxWidths = 0;
            var sumOfVisibleMaxHeights = 0;
            wrapGroupsPerPage = 0;
            // tslint:disable-next-line:prefer-for-of
            for (var i = 0; i < content.children.length; ++i) {
                ++arrayStartIndex;
                var child = content.children[i];
                var clientRect = this.getElementSize(child);
                maxWidthForWrapGroup = Math.max(maxWidthForWrapGroup, clientRect.width);
                maxHeightForWrapGroup = Math.max(maxHeightForWrapGroup, clientRect.height);
                if (arrayStartIndex % itemsPerWrapGroup === 0) {
                    var oldValue = this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
                    if (oldValue) {
                        --this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= oldValue.childWidth || 0;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= oldValue.childHeight || 0;
                    }
                    ++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                    var items = this.items.slice(arrayStartIndex - itemsPerWrapGroup, arrayStartIndex);
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = {
                        childWidth: maxWidthForWrapGroup,
                        childHeight: maxHeightForWrapGroup,
                        items: items
                    };
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += maxWidthForWrapGroup;
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += maxHeightForWrapGroup;
                    if (this.horizontal) {
                        var maxVisibleWidthForWrapGroup = Math.min(maxWidthForWrapGroup, Math.max(viewportWidth - sumOfVisibleMaxWidths, 0));
                        if (scrollOffset > 0) {
                            var scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleWidthForWrapGroup);
                            maxVisibleWidthForWrapGroup -= scrollOffsetToRemove;
                            scrollOffset -= scrollOffsetToRemove;
                        }
                        sumOfVisibleMaxWidths += maxVisibleWidthForWrapGroup;
                        if (maxVisibleWidthForWrapGroup > 0 && viewportWidth >= sumOfVisibleMaxWidths) {
                            ++wrapGroupsPerPage;
                        }
                    }
                    else {
                        var maxVisibleHeightForWrapGroup = Math.min(maxHeightForWrapGroup, Math.max(viewportHeight - sumOfVisibleMaxHeights, 0));
                        if (scrollOffset > 0) {
                            var scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleHeightForWrapGroup);
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
            var averageChildWidth = this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths /
                this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
            var averageChildHeight = this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights /
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
        var itemCount = this.items.length;
        var itemsPerPage = itemsPerWrapGroup * wrapGroupsPerPage;
        var pageCountFractional = itemCount / itemsPerPage;
        var numberOfWrapGroups = Math.ceil(itemCount / itemsPerWrapGroup);
        var scrollLength = 0;
        var defaultScrollLengthPerWrapGroup = this.horizontal ? defaultChildWidth : defaultChildHeight;
        if (this.enableUnequalChildrenSizes) {
            var numUnknownChildSizes = 0;
            for (var i = 0; i < numberOfWrapGroups; ++i) {
                var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
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
        var viewportLength = this.horizontal ? viewportWidth : viewportHeight;
        var maxScrollPosition = Math.max(scrollLength - viewportLength, 0);
        return {
            childHeight: defaultChildHeight,
            childWidth: defaultChildWidth,
            itemCount: itemCount,
            itemsPerPage: itemsPerPage,
            itemsPerWrapGroup: itemsPerWrapGroup,
            maxScrollPosition: maxScrollPosition,
            pageCount_fractional: pageCountFractional,
            scrollLength: scrollLength,
            viewportLength: viewportLength,
            wrapGroupsPerPage: wrapGroupsPerPage,
        };
    };
    VirtualScrollerComponent.prototype.calculatePadding = function (arrayStartIndexWithBuffer, dimensions) {
        if (dimensions.itemCount === 0) {
            return 0;
        }
        var defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
        var startingWrapGroupIndex = Math.floor(arrayStartIndexWithBuffer / dimensions.itemsPerWrapGroup) || 0;
        if (!this.enableUnequalChildrenSizes) {
            return defaultScrollLengthPerWrapGroup * startingWrapGroupIndex;
        }
        var numUnknownChildSizes = 0;
        var result = 0;
        for (var i = 0; i < startingWrapGroupIndex; ++i) {
            var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
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
    };
    VirtualScrollerComponent.prototype.calculatePageInfo = function (scrollPosition, dimensions) {
        var scrollPercentage = 0;
        if (this.enableUnequalChildrenSizes) {
            var numberOfWrapGroups = Math.ceil(dimensions.itemCount / dimensions.itemsPerWrapGroup);
            var totalScrolledLength = 0;
            var defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
            for (var i = 0; i < numberOfWrapGroups; ++i) {
                var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
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
        var startingArrayIndexFractional = Math.min(Math.max(scrollPercentage * dimensions.pageCount_fractional, 0), dimensions.pageCount_fractional) * dimensions.itemsPerPage;
        var maxStart = dimensions.itemCount - dimensions.itemsPerPage - 1;
        var arrayStartIndex = Math.min(Math.floor(startingArrayIndexFractional), maxStart);
        arrayStartIndex -= arrayStartIndex % dimensions.itemsPerWrapGroup; // round down to start of wrapGroup
        if (this.stripedTable) {
            var bufferBoundary = 2 * dimensions.itemsPerWrapGroup;
            if (arrayStartIndex % bufferBoundary !== 0) {
                arrayStartIndex = Math.max(arrayStartIndex - arrayStartIndex % bufferBoundary, 0);
            }
        }
        var arrayEndIndex = Math.ceil(startingArrayIndexFractional) + dimensions.itemsPerPage - 1;
        var endIndexWithinWrapGroup = (arrayEndIndex + 1) % dimensions.itemsPerWrapGroup;
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
        var bufferSize = this.bufferAmount * dimensions.itemsPerWrapGroup;
        var startIndexWithBuffer = Math.min(Math.max(arrayStartIndex - bufferSize, 0), dimensions.itemCount - 1);
        var endIndexWithBuffer = Math.min(Math.max(arrayEndIndex + bufferSize, 0), dimensions.itemCount - 1);
        return {
            startIndex: arrayStartIndex,
            endIndex: arrayEndIndex,
            startIndexWithBuffer: startIndexWithBuffer,
            endIndexWithBuffer: endIndexWithBuffer,
            scrollStartPosition: scrollPosition,
            scrollEndPosition: scrollPosition + dimensions.viewportLength,
            maxScrollPosition: dimensions.maxScrollPosition
        };
    };
    VirtualScrollerComponent.prototype.calculateViewport = function () {
        var dimensions = this.calculateDimensions();
        var offset = this.getElementsOffset();
        var scrollStartPosition = this.getScrollStartPosition();
        if (scrollStartPosition > (dimensions.scrollLength + offset) && !(this.parentScroll instanceof Window)) {
            scrollStartPosition = dimensions.scrollLength;
        }
        else {
            scrollStartPosition -= offset;
        }
        scrollStartPosition = Math.max(0, scrollStartPosition);
        var pageInfo = this.calculatePageInfo(scrollStartPosition, dimensions);
        var newPadding = this.calculatePadding(pageInfo.startIndexWithBuffer, dimensions);
        var newScrollLength = dimensions.scrollLength;
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
    };
    VirtualScrollerComponent.ctorParameters = function () { return [
        { type: ElementRef },
        { type: Renderer2 },
        { type: NgZone },
        { type: ChangeDetectorRef },
        { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: ['virtual-scroller-default-options',] }] }
    ]; };
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
            template: "\n        <div class=\"total-padding\" #invisiblePadding></div>\n        <div class=\"scrollable-content\" #content>\n            <ng-content></ng-content>\n        </div>\n    ",
            host: {
                '[class.horizontal]': 'horizontal',
                '[class.vertical]': '!horizontal',
                '[class.selfScroll]': '!parentScroll',
                '[class.rtl]': 'RTL'
            },
            styles: ["\n        :host {\n            position: relative;\n            display: block;\n            -webkit-overflow-scrolling: touch;\n        }\n\n        :host.horizontal.selfScroll {\n            overflow-y: visible;\n            overflow-x: auto;\n        }\n\n        :host.horizontal.selfScroll.rtl {\n            transform: scaleX(-1);\n        }\n\n        :host.vertical.selfScroll {\n            overflow-y: auto;\n            overflow-x: visible;\n        }\n\n        .scrollable-content {\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            max-width: 100vw;\n            max-height: 100vh;\n            position: absolute;\n        }\n\n        .scrollable-content ::ng-deep > * {\n            box-sizing: border-box;\n        }\n\n        :host.horizontal {\n            white-space: nowrap;\n        }\n\n        :host.horizontal .scrollable-content {\n            display: flex;\n        }\n\n        :host.horizontal .scrollable-content ::ng-deep > * {\n            flex-shrink: 0;\n            flex-grow: 0;\n            white-space: initial;\n        }\n\n        :host.horizontal.rtl .scrollable-content ::ng-deep > * {\n            transform: scaleX(-1);\n        }\n\n        .total-padding {\n            position: absolute;\n            top: 0;\n            left: 0;\n            height: 1px;\n            width: 1px;\n            transform-origin: 0 0;\n            opacity: 0;\n        }\n\n        :host.horizontal .total-padding {\n            height: 100%;\n        }\n    "]
        }),
        __param(4, Inject(PLATFORM_ID)),
        __param(5, Optional()), __param(5, Inject('virtual-scroller-default-options'))
    ], VirtualScrollerComponent);
    return VirtualScrollerComponent;
}());
export { VirtualScrollerComponent };
var VirtualScrollerModule = /** @class */ (function () {
    function VirtualScrollerModule() {
    }
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
    return VirtualScrollerModule;
}());
export { VirtualScrollerModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC12aXJ0dWFsLXNjcm9sbGVyLyIsInNvdXJjZXMiOlsidmlydHVhbC1zY3JvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUNILGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsWUFBWSxFQUFFLE9BQU8sRUFDckIsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxNQUFNLEVBQ04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsU0FBUyxHQUNaLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFakQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTdDLE9BQU8sS0FBSyxLQUFLLE1BQU0sbUJBQW1CLENBQUE7QUFjMUMsTUFBTSxVQUFVLHdDQUF3QztJQUNwRCxPQUFPO1FBQ0gsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixpQ0FBaUMsRUFBRSxJQUFJO1FBQ3ZDLDRCQUE0QixFQUFFLENBQUM7UUFDL0IsbUJBQW1CLEVBQUUsR0FBRztRQUN4QixrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLG9CQUFvQixFQUFFLENBQUM7UUFDdkIsWUFBWSxFQUFFLEtBQUs7S0FDdEIsQ0FBQztBQUNOLENBQUM7QUE4SEQ7SUEySEksa0NBQ3VCLE9BQW1CLEVBQ25CLFFBQW1CLEVBQ25CLElBQVksRUFDckIsaUJBQW9DO0lBQzlDLHFDQUFxQztJQUNoQixVQUFrQixFQUVuQyxPQUFzQztRQVB2QixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBQ25CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFDbkIsU0FBSSxHQUFKLElBQUksQ0FB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LENBQUM7WUFDeEMsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDO1lBQ3ZCLFNBQVMsRUFBRTtnQkFDUDtvQkFDSSxPQUFPLEVBQUUsa0NBQWtDO29CQUMzQyxVQUFVLEVBQUUsd0NBQXdDO2lCQUN2RDthQUNKO1NBQ0osQ0FBQztPQUNXLHFCQUFxQixDQUNqQztJQUFELDRCQUFDO0NBQUEsQUFERCxJQUNDO1NBRFkscUJBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBDb21wb25lbnQsXG4gICAgQ29udGVudENoaWxkLCBEb0NoZWNrLFxuICAgIEVsZW1lbnRSZWYsXG4gICAgRXZlbnRFbWl0dGVyLFxuICAgIEluamVjdCxcbiAgICBJbnB1dCxcbiAgICBOZ01vZHVsZSxcbiAgICBOZ1pvbmUsXG4gICAgT25DaGFuZ2VzLFxuICAgIE9uRGVzdHJveSxcbiAgICBPbkluaXQsXG4gICAgT3B0aW9uYWwsXG4gICAgT3V0cHV0LFxuICAgIFJlbmRlcmVyMixcbiAgICBWaWV3Q2hpbGQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1BMQVRGT1JNX0lEfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7aXNQbGF0Zm9ybVNlcnZlcn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuaW1wb3J0IHtDb21tb25Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCAqIGFzIHR3ZWVuIGZyb20gJ0B0d2VlbmpzL3R3ZWVuLmpzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFZpcnR1YWxTY3JvbGxlckRlZmF1bHRPcHRpb25zIHtcbiAgICBjaGVja1Jlc2l6ZUludGVydmFsOiBudW1iZXJcbiAgICBtb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGw6IGJvb2xlYW4sXG4gICAgcmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDogbnVtYmVyLFxuICAgIHNjcm9sbEFuaW1hdGlvblRpbWU6IG51bWJlcjtcbiAgICBzY3JvbGxEZWJvdW5jZVRpbWU6IG51bWJlcjtcbiAgICBzY3JvbGxUaHJvdHRsaW5nVGltZTogbnVtYmVyO1xuICAgIHNjcm9sbGJhckhlaWdodD86IG51bWJlcjtcbiAgICBzY3JvbGxiYXJXaWR0aD86IG51bWJlcjtcbiAgICBzdHJpcGVkVGFibGU6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFZJUlRVQUxfU0NST0xMRVJfREVGQVVMVF9PUFRJT05TX0ZBQ1RPUlkoKTogVmlydHVhbFNjcm9sbGVyRGVmYXVsdE9wdGlvbnMge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNoZWNrUmVzaXplSW50ZXJ2YWw6IDEwMDAsXG4gICAgICAgIG1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbDogdHJ1ZSxcbiAgICAgICAgcmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDogNSxcbiAgICAgICAgc2Nyb2xsQW5pbWF0aW9uVGltZTogNzUwLFxuICAgICAgICBzY3JvbGxEZWJvdW5jZVRpbWU6IDAsXG4gICAgICAgIHNjcm9sbFRocm90dGxpbmdUaW1lOiAwLFxuICAgICAgICBzdHJpcGVkVGFibGU6IGZhbHNlXG4gICAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBXcmFwR3JvdXBEaW1lbnNpb25zIHtcbiAgICBtYXhDaGlsZFNpemVQZXJXcmFwR3JvdXA6IFdyYXBHcm91cERpbWVuc2lvbltdO1xuICAgIG51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzOiBudW1iZXI7XG4gICAgc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0czogbnVtYmVyO1xuICAgIHN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRoczogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdyYXBHcm91cERpbWVuc2lvbiB7XG4gICAgY2hpbGRIZWlnaHQ6IG51bWJlcjtcbiAgICBjaGlsZFdpZHRoOiBudW1iZXI7XG4gICAgaXRlbXM6IGFueVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElEaW1lbnNpb25zIHtcbiAgICBjaGlsZEhlaWdodDogbnVtYmVyO1xuICAgIGNoaWxkV2lkdGg6IG51bWJlcjtcbiAgICBpdGVtQ291bnQ6IG51bWJlcjtcbiAgICBpdGVtc1BlclBhZ2U6IG51bWJlcjtcbiAgICBpdGVtc1BlcldyYXBHcm91cDogbnVtYmVyO1xuICAgIG1heFNjcm9sbFBvc2l0aW9uOiBudW1iZXI7XG4gICAgcGFnZUNvdW50X2ZyYWN0aW9uYWw6IG51bWJlcjtcbiAgICBzY3JvbGxMZW5ndGg6IG51bWJlcjtcbiAgICB2aWV3cG9ydExlbmd0aDogbnVtYmVyO1xuICAgIHdyYXBHcm91cHNQZXJQYWdlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBhZ2VJbmZvIHtcbiAgICBlbmRJbmRleDogbnVtYmVyO1xuICAgIGVuZEluZGV4V2l0aEJ1ZmZlcjogbnVtYmVyO1xuICAgIG1heFNjcm9sbFBvc2l0aW9uOiBudW1iZXI7XG4gICAgc2Nyb2xsRW5kUG9zaXRpb246IG51bWJlcjtcbiAgICBzY3JvbGxTdGFydFBvc2l0aW9uOiBudW1iZXI7XG4gICAgc3RhcnRJbmRleDogbnVtYmVyO1xuICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVZpZXdwb3J0IGV4dGVuZHMgSVBhZ2VJbmZvIHtcbiAgICBwYWRkaW5nOiBudW1iZXI7XG4gICAgc2Nyb2xsTGVuZ3RoOiBudW1iZXI7XG59XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAndmlydHVhbC1zY3JvbGxlcixbdmlydHVhbFNjcm9sbGVyXScsXG4gICAgZXhwb3J0QXM6ICd2aXJ0dWFsU2Nyb2xsZXInLFxuICAgIHRlbXBsYXRlOiBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ0b3RhbC1wYWRkaW5nXCIgI2ludmlzaWJsZVBhZGRpbmc+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGxhYmxlLWNvbnRlbnRcIiAjY29udGVudD5cbiAgICAgICAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAgICAgICAgPC9kaXY+XG4gICAgYCxcbiAgICBob3N0OiB7XG4gICAgICAgICdbY2xhc3MuaG9yaXpvbnRhbF0nOiAnaG9yaXpvbnRhbCcsXG4gICAgICAgICdbY2xhc3MudmVydGljYWxdJzogJyFob3Jpem9udGFsJyxcbiAgICAgICAgJ1tjbGFzcy5zZWxmU2Nyb2xsXSc6ICchcGFyZW50U2Nyb2xsJyxcbiAgICAgICAgJ1tjbGFzcy5ydGxdJzogJ1JUTCdcbiAgICB9LFxuICAgIHN0eWxlczogW2BcbiAgICAgICAgOmhvc3Qge1xuICAgICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsLnNlbGZTY3JvbGwge1xuICAgICAgICAgICAgb3ZlcmZsb3cteTogdmlzaWJsZTtcbiAgICAgICAgICAgIG92ZXJmbG93LXg6IGF1dG87XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsLnNlbGZTY3JvbGwucnRsIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGVYKC0xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0LnZlcnRpY2FsLnNlbGZTY3JvbGwge1xuICAgICAgICAgICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICAgICAgICAgIG92ZXJmbG93LXg6IHZpc2libGU7XG4gICAgICAgIH1cblxuICAgICAgICAuc2Nyb2xsYWJsZS1jb250ZW50IHtcbiAgICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICAgIG1heC13aWR0aDogMTAwdnc7XG4gICAgICAgICAgICBtYXgtaGVpZ2h0OiAxMDB2aDtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zY3JvbGxhYmxlLWNvbnRlbnQgOjpuZy1kZWVwID4gKiB7XG4gICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbCB7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbCAuc2Nyb2xsYWJsZS1jb250ZW50IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsIC5zY3JvbGxhYmxlLWNvbnRlbnQgOjpuZy1kZWVwID4gKiB7XG4gICAgICAgICAgICBmbGV4LXNocmluazogMDtcbiAgICAgICAgICAgIGZsZXgtZ3JvdzogMDtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBpbml0aWFsO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbC5ydGwgLnNjcm9sbGFibGUtY29udGVudCA6Om5nLWRlZXAgPiAqIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGVYKC0xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC50b3RhbC1wYWRkaW5nIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgICBoZWlnaHQ6IDFweDtcbiAgICAgICAgICAgIHdpZHRoOiAxcHg7XG4gICAgICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiAwIDA7XG4gICAgICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QuaG9yaXpvbnRhbCAudG90YWwtcGFkZGluZyB7XG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIH1cbiAgICBgXVxufSlcbmV4cG9ydCBjbGFzcyBWaXJ0dWFsU2Nyb2xsZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBEb0NoZWNrIHtcblxuICAgIHB1YmxpYyBnZXQgdmlld1BvcnRJbmZvKCk6IElQYWdlSW5mbyB7XG4gICAgICAgIGNvbnN0IHBhZ2VJbmZvOiBJVmlld3BvcnQgPSB0aGlzLnByZXZpb3VzVmlld1BvcnQgfHwgKHt9IGFzIGFueSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydEluZGV4OiBwYWdlSW5mby5zdGFydEluZGV4IHx8IDAsXG4gICAgICAgICAgICBlbmRJbmRleDogcGFnZUluZm8uZW5kSW5kZXggfHwgMCxcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb246IHBhZ2VJbmZvLnNjcm9sbFN0YXJ0UG9zaXRpb24gfHwgMCxcbiAgICAgICAgICAgIHNjcm9sbEVuZFBvc2l0aW9uOiBwYWdlSW5mby5zY3JvbGxFbmRQb3NpdGlvbiB8fCAwLFxuICAgICAgICAgICAgbWF4U2Nyb2xsUG9zaXRpb246IHBhZ2VJbmZvLm1heFNjcm9sbFBvc2l0aW9uIHx8IDAsXG4gICAgICAgICAgICBzdGFydEluZGV4V2l0aEJ1ZmZlcjogcGFnZUluZm8uc3RhcnRJbmRleFdpdGhCdWZmZXIgfHwgMCxcbiAgICAgICAgICAgIGVuZEluZGV4V2l0aEJ1ZmZlcjogcGFnZUluZm8uZW5kSW5kZXhXaXRoQnVmZmVyIHx8IDBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2VuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzID0gdmFsdWU7XG4gICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IGJ1ZmZlckFtb3VudCgpOiBudW1iZXIge1xuICAgICAgICBpZiAodHlwZW9mICh0aGlzLl9idWZmZXJBbW91bnQpID09PSAnbnVtYmVyJyAmJiB0aGlzLl9idWZmZXJBbW91bnQgPj0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2J1ZmZlckFtb3VudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzID8gNSA6IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGJ1ZmZlckFtb3VudCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX2J1ZmZlckFtb3VudCA9IHZhbHVlO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBzY3JvbGxUaHJvdHRsaW5nVGltZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Nyb2xsVGhyb3R0bGluZ1RpbWU7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBzY3JvbGxUaHJvdHRsaW5nVGltZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbFRocm90dGxpbmdUaW1lID0gdmFsdWU7XG4gICAgICAgIHRoaXMudXBkYXRlT25TY3JvbGxGdW5jdGlvbigpO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBzY3JvbGxEZWJvdW5jZVRpbWUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Njcm9sbERlYm91bmNlVGltZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHNjcm9sbERlYm91bmNlVGltZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbERlYm91bmNlVGltZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnVwZGF0ZU9uU2Nyb2xsRnVuY3Rpb24oKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgY2hlY2tSZXNpemVJbnRlcnZhbCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGNoZWNrUmVzaXplSW50ZXJ2YWwodmFsdWU6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NoZWNrUmVzaXplSW50ZXJ2YWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5hZGRTY3JvbGxFdmVudEhhbmRsZXJzKCk7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IGl0ZW1zKCk6IGFueVtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZW1zO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgaXRlbXModmFsdWU6IGFueVtdKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdGhpcy5faXRlbXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2l0ZW1zID0gdmFsdWUgfHwgW107XG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbCh0cnVlKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgaG9yaXpvbnRhbCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hvcml6b250YWw7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBob3Jpem9udGFsKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX2hvcml6b250YWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy51cGRhdGVEaXJlY3Rpb24oKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgcGFyZW50U2Nyb2xsKCk6IEVsZW1lbnQgfCBXaW5kb3cge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50U2Nyb2xsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgcGFyZW50U2Nyb2xsKHZhbHVlOiBFbGVtZW50IHwgV2luZG93KSB7XG4gICAgICAgIGlmICh0aGlzLl9wYXJlbnRTY3JvbGwgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJldmVydFBhcmVudE92ZXJzY3JvbGwoKTtcbiAgICAgICAgdGhpcy5fcGFyZW50U2Nyb2xsID0gdmFsdWU7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuXG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKHRoaXMubW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsICYmIHNjcm9sbEVsZW1lbnQgIT09IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLm9sZFBhcmVudFNjcm9sbE92ZXJmbG93ID0ge3g6IHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXgnXSwgeTogc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteSddfTtcbiAgICAgICAgICAgIHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXknXSA9IHRoaXMuaG9yaXpvbnRhbCA/ICd2aXNpYmxlJyA6ICdhdXRvJztcbiAgICAgICAgICAgIHNjcm9sbEVsZW1lbnQuc3R5bGVbJ292ZXJmbG93LXgnXSA9IHRoaXMuaG9yaXpvbnRhbCA/ICdhdXRvJyA6ICd2aXNpYmxlJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgZWxlbWVudDogRWxlbWVudFJlZixcbiAgICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IHJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgICAgIHByb3RlY3RlZCByZWFkb25seSB6b25lOiBOZ1pvbmUsXG4gICAgICAgIHByb3RlY3RlZCBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpiYW4tdHlwZXNcbiAgICAgICAgQEluamVjdChQTEFURk9STV9JRCkgcGxhdGZvcm1JZDogT2JqZWN0LFxuICAgICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KCd2aXJ0dWFsLXNjcm9sbGVyLWRlZmF1bHQtb3B0aW9ucycpXG4gICAgICAgICAgICBvcHRpb25zOiBWaXJ0dWFsU2Nyb2xsZXJEZWZhdWx0T3B0aW9uc1xuICAgICkge1xuXG4gICAgICAgIHRoaXMuaXNBbmd1bGFyVW5pdmVyc2FsU1NSID0gaXNQbGF0Zm9ybVNlcnZlcihwbGF0Zm9ybUlkKTtcblxuICAgICAgICB0aGlzLmNoZWNrUmVzaXplSW50ZXJ2YWwgPSBvcHRpb25zLmNoZWNrUmVzaXplSW50ZXJ2YWw7XG4gICAgICAgIHRoaXMubW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsID0gb3B0aW9ucy5tb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGw7XG4gICAgICAgIHRoaXMucmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZCA9IG9wdGlvbnMucmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDtcbiAgICAgICAgdGhpcy5zY3JvbGxBbmltYXRpb25UaW1lID0gb3B0aW9ucy5zY3JvbGxBbmltYXRpb25UaW1lO1xuICAgICAgICB0aGlzLnNjcm9sbERlYm91bmNlVGltZSA9IG9wdGlvbnMuc2Nyb2xsRGVib3VuY2VUaW1lO1xuICAgICAgICB0aGlzLnNjcm9sbFRocm90dGxpbmdUaW1lID0gb3B0aW9ucy5zY3JvbGxUaHJvdHRsaW5nVGltZTtcbiAgICAgICAgdGhpcy5zY3JvbGxiYXJIZWlnaHQgPSBvcHRpb25zLnNjcm9sbGJhckhlaWdodDtcbiAgICAgICAgdGhpcy5zY3JvbGxiYXJXaWR0aCA9IG9wdGlvbnMuc2Nyb2xsYmFyV2lkdGg7XG4gICAgICAgIHRoaXMuc3RyaXBlZFRhYmxlID0gb3B0aW9ucy5zdHJpcGVkVGFibGU7XG5cbiAgICAgICAgdGhpcy5ob3Jpem9udGFsID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzZXRXcmFwR3JvdXBEaW1lbnNpb25zKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHZpZXdQb3J0SXRlbXM6IGFueVtdO1xuICAgIHB1YmxpYyB3aW5kb3cgPSB3aW5kb3c7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBleGVjdXRlUmVmcmVzaE91dHNpZGVBbmd1bGFyWm9uZSA9IGZhbHNlO1xuXG4gICAgcHJvdGVjdGVkIF9lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyA9IGZhbHNlO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgUlRMID0gZmFsc2U7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyB1c2VNYXJnaW5JbnN0ZWFkT2ZUcmFuc2xhdGUgPSBmYWxzZTtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIG1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbDogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHN0cmlwZWRUYWJsZTogYm9vbGVhbjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNjcm9sbGJhcldpZHRoOiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzY3JvbGxiYXJIZWlnaHQ6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGNoaWxkV2lkdGg6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGNoaWxkSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzc3JDaGlsZFdpZHRoOiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzc3JDaGlsZEhlaWdodDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc3NyVmlld3BvcnRXaWR0aCA9IDE5MjA7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzc3JWaWV3cG9ydEhlaWdodCA9IDEwODA7XG5cbiAgICBwcm90ZWN0ZWQgX2J1ZmZlckFtb3VudDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc2Nyb2xsQW5pbWF0aW9uVGltZTogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgcmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIF9zY3JvbGxUaHJvdHRsaW5nVGltZTogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIF9zY3JvbGxEZWJvdW5jZVRpbWU6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCBvblNjcm9sbDogKCkgPT4gdm9pZDtcblxuICAgIHByb3RlY3RlZCBjaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkVGltZXI6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgX2NoZWNrUmVzaXplSW50ZXJ2YWw6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCBfaXRlbXM6IGFueVtdID0gW107XG5cbiAgICBwcm90ZWN0ZWQgX2hvcml6b250YWw6IGJvb2xlYW47XG5cbiAgICBwcm90ZWN0ZWQgb2xkUGFyZW50U2Nyb2xsT3ZlcmZsb3c6IHsgeDogc3RyaW5nLCB5OiBzdHJpbmcgfTtcbiAgICBwcm90ZWN0ZWQgX3BhcmVudFNjcm9sbDogRWxlbWVudCB8IFdpbmRvdztcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyB2c1VwZGF0ZTogRXZlbnRFbWl0dGVyPGFueVtdPiA9IG5ldyBFdmVudEVtaXR0ZXI8YW55W10+KCk7XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgdnNDaGFuZ2U6IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUGFnZUluZm8+KCk7XG5cbiAgICBAT3V0cHV0KClcbiAgICBwdWJsaWMgdnNTdGFydDogRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4gPSBuZXcgRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4oKTtcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyB2c0VuZDogRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4gPSBuZXcgRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4oKTtcblxuICAgIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnLCB7cmVhZDogRWxlbWVudFJlZiwgc3RhdGljOiB0cnVlfSlcbiAgICBwcm90ZWN0ZWQgY29udGVudEVsZW1lbnRSZWY6IEVsZW1lbnRSZWY7XG5cbiAgICBAVmlld0NoaWxkKCdpbnZpc2libGVQYWRkaW5nJywge3JlYWQ6IEVsZW1lbnRSZWYsIHN0YXRpYzogdHJ1ZX0pXG4gICAgcHJvdGVjdGVkIGludmlzaWJsZVBhZGRpbmdFbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gICAgQENvbnRlbnRDaGlsZCgnaGVhZGVyJywge3JlYWQ6IEVsZW1lbnRSZWYsIHN0YXRpYzogZmFsc2V9KVxuICAgIHByb3RlY3RlZCBoZWFkZXJFbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gICAgQENvbnRlbnRDaGlsZCgnY29udGFpbmVyJywge3JlYWQ6IEVsZW1lbnRSZWYsIHN0YXRpYzogZmFsc2V9KVxuICAgIHByb3RlY3RlZCBjb250YWluZXJFbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gICAgcHJvdGVjdGVkIGlzQW5ndWxhclVuaXZlcnNhbFNTUjogYm9vbGVhbjtcblxuICAgIHByb3RlY3RlZCBwcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdDogQ2xpZW50UmVjdDtcblxuICAgIHByb3RlY3RlZCBfaW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5O1xuICAgIHByb3RlY3RlZCBfb2Zmc2V0VHlwZTtcbiAgICBwcm90ZWN0ZWQgX3Njcm9sbFR5cGU7XG4gICAgcHJvdGVjdGVkIF9wYWdlT2Zmc2V0VHlwZTtcbiAgICBwcm90ZWN0ZWQgX2NoaWxkU2Nyb2xsRGltO1xuICAgIHByb3RlY3RlZCBfdHJhbnNsYXRlRGlyO1xuICAgIHByb3RlY3RlZCBfbWFyZ2luRGlyO1xuXG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZWRTY3JvbGxiYXJXaWR0aCA9IDA7XG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZWRTY3JvbGxiYXJIZWlnaHQgPSAwO1xuXG4gICAgcHJvdGVjdGVkIHBhZGRpbmcgPSAwO1xuICAgIHByb3RlY3RlZCBwcmV2aW91c1ZpZXdQb3J0OiBJVmlld3BvcnQgPSB7fSBhcyBhbnk7XG4gICAgcHJvdGVjdGVkIGN1cnJlbnRUd2VlbjogdHdlZW4uVHdlZW47XG4gICAgcHJvdGVjdGVkIGNhY2hlZEl0ZW1zTGVuZ3RoOiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgZGlzcG9zZVNjcm9sbEhhbmRsZXI6ICgpID0+IHZvaWQgfCB1bmRlZmluZWQ7XG4gICAgcHJvdGVjdGVkIGRpc3Bvc2VSZXNpemVIYW5kbGVyOiAoKSA9PiB2b2lkIHwgdW5kZWZpbmVkO1xuXG4gICAgcHJvdGVjdGVkIG1pbk1lYXN1cmVkQ2hpbGRXaWR0aDogbnVtYmVyO1xuICAgIHByb3RlY3RlZCBtaW5NZWFzdXJlZENoaWxkSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgd3JhcEdyb3VwRGltZW5zaW9uczogV3JhcEdyb3VwRGltZW5zaW9ucztcblxuICAgIHByb3RlY3RlZCBjYWNoZWRQYWdlU2l6ZSA9IDA7XG4gICAgcHJvdGVjdGVkIHByZXZpb3VzU2Nyb2xsTnVtYmVyRWxlbWVudHMgPSAwO1xuXG4gICAgcHJvdGVjdGVkIHVwZGF0ZU9uU2Nyb2xsRnVuY3Rpb24oKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbERlYm91bmNlVGltZSkge1xuICAgICAgICAgICAgdGhpcy5vblNjcm9sbCA9ICh0aGlzLmRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfSwgdGhpcy5zY3JvbGxEZWJvdW5jZVRpbWUpIGFzIGFueSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zY3JvbGxUaHJvdHRsaW5nVGltZSkge1xuICAgICAgICAgICAgdGhpcy5vblNjcm9sbCA9ICh0aGlzLnRocm90dGxlVHJhaWxpbmcoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgICAgICAgICB9LCB0aGlzLnNjcm9sbFRocm90dGxpbmdUaW1lKSBhcyBhbnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vblNjcm9sbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGNvbXBhcmVJdGVtczogKGl0ZW0xOiBhbnksIGl0ZW0yOiBhbnkpID0+IGJvb2xlYW4gPSAoaXRlbTE6IGFueSwgaXRlbTI6IGFueSkgPT4gaXRlbTEgPT09IGl0ZW0yO1xuXG4gICAgcHJvdGVjdGVkIHJldmVydFBhcmVudE92ZXJzY3JvbGwoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKHNjcm9sbEVsZW1lbnQgJiYgdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdykge1xuICAgICAgICAgICAgc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteSddID0gdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdy55O1xuICAgICAgICAgICAgc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteCddID0gdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdy54O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vbGRQYXJlbnRTY3JvbGxPdmVyZmxvdyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxFdmVudEhhbmRsZXJzKCk7XG4gICAgICAgIHRoaXMucmV2ZXJ0UGFyZW50T3ZlcnNjcm9sbCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaW5kZXhMZW5ndGhDaGFuZ2VkID0gdGhpcy5jYWNoZWRJdGVtc0xlbmd0aCAhPT0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIHRoaXMuY2FjaGVkSXRlbXNMZW5ndGggPSB0aGlzLml0ZW1zLmxlbmd0aDtcblxuICAgICAgICBjb25zdCBmaXJzdFJ1bjogYm9vbGVhbiA9ICFjaGFuZ2VzLml0ZW1zIHx8ICFjaGFuZ2VzLml0ZW1zLnByZXZpb3VzVmFsdWUgfHwgY2hhbmdlcy5pdGVtcy5wcmV2aW91c1ZhbHVlLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGluZGV4TGVuZ3RoQ2hhbmdlZCB8fCBmaXJzdFJ1bik7XG4gICAgfVxuXG4gICAgcHVibGljIG5nRG9DaGVjaygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVkSXRlbXNMZW5ndGggIT09IHRoaXMuaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmNhY2hlZEl0ZW1zTGVuZ3RoID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwodHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcmV2aW91c1ZpZXdQb3J0ICYmIHRoaXMudmlld1BvcnRJdGVtcyAmJiB0aGlzLnZpZXdQb3J0SXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IGl0ZW1zQXJyYXlDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudmlld1BvcnRJdGVtcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jb21wYXJlSXRlbXModGhpcy5pdGVtc1t0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXIgKyBpXSwgdGhpcy52aWV3UG9ydEl0ZW1zW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtc0FycmF5Q2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtc0FycmF5Q2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZWZyZXNoKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwodHJ1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGludmFsaWRhdGVBbGxDYWNoZWRNZWFzdXJlbWVudHMoKTogdm9pZCB7XG4gICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgIG1heENoaWxkU2l6ZVBlcldyYXBHcm91cDogW10sXG4gICAgICAgICAgICBudW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplczogMCxcbiAgICAgICAgICAgIHN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRoczogMCxcbiAgICAgICAgICAgIHN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHM6IDBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGludmFsaWRhdGVDYWNoZWRNZWFzdXJlbWVudEZvckl0ZW0oaXRlbTogYW55KTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVDYWNoZWRNZWFzdXJlbWVudEF0SW5kZXgoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbnZhbGlkYXRlQ2FjaGVkTWVhc3VyZW1lbnRBdEluZGV4KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZE1lYXN1cmVtZW50ID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpbmRleF07XG4gICAgICAgICAgICBpZiAoY2FjaGVkTWVhc3VyZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2luZGV4XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAtLXRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzIC09IGNhY2hlZE1lYXN1cmVtZW50LmNoaWxkV2lkdGggfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0cyAtPSBjYWNoZWRNZWFzdXJlbWVudC5jaGlsZEhlaWdodCB8fCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzY3JvbGxJbnRvKGl0ZW06IGFueSwgYWxpZ25Ub0JlZ2lubmluZzogYm9vbGVhbiA9IHRydWUsIGFkZGl0aW9uYWxPZmZzZXQ6IG51bWJlciA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uTWlsbGlzZWNvbmRzPzogbnVtYmVyLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaW5kZXg6IG51bWJlciA9IHRoaXMuaXRlbXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zY3JvbGxUb0luZGV4KGluZGV4LCBhbGlnblRvQmVnaW5uaW5nLCBhZGRpdGlvbmFsT2Zmc2V0LCBhbmltYXRpb25NaWxsaXNlY29uZHMsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCBhbGlnblRvQmVnaW5uaW5nOiBib29sZWFuID0gdHJ1ZSwgYWRkaXRpb25hbE9mZnNldDogbnVtYmVyID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHM/OiBudW1iZXIsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBsZXQgbWF4UmV0cmllcyA9IDU7XG5cbiAgICAgICAgY29uc3QgcmV0cnlJZk5lZWRlZCA9ICgpID0+IHtcbiAgICAgICAgICAgIC0tbWF4UmV0cmllcztcbiAgICAgICAgICAgIGlmIChtYXhSZXRyaWVzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gdGhpcy5jYWxjdWxhdGVEaW1lbnNpb25zKCk7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3RhcnRJbmRleCA9IE1hdGgubWluKE1hdGgubWF4KGluZGV4LCAwKSwgZGltZW5zaW9ucy5pdGVtQ291bnQgLSAxKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleCA9PT0gZGVzaXJlZFN0YXJ0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvSW5kZXhfaW50ZXJuYWwoaW5kZXgsIGFsaWduVG9CZWdpbm5pbmcsIGFkZGl0aW9uYWxPZmZzZXQsIDAsIHJldHJ5SWZOZWVkZWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9JbmRleF9pbnRlcm5hbChpbmRleCwgYWxpZ25Ub0JlZ2lubmluZywgYWRkaXRpb25hbE9mZnNldCwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzLCByZXRyeUlmTmVlZGVkKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2Nyb2xsVG9JbmRleF9pbnRlcm5hbChpbmRleDogbnVtYmVyLCBhbGlnblRvQmVnaW5uaW5nOiBib29sZWFuID0gdHJ1ZSwgYWRkaXRpb25hbE9mZnNldDogbnVtYmVyID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHM/OiBudW1iZXIsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHMgPSBhbmltYXRpb25NaWxsaXNlY29uZHMgPT09IHVuZGVmaW5lZCA/IHRoaXMuc2Nyb2xsQW5pbWF0aW9uVGltZSA6IGFuaW1hdGlvbk1pbGxpc2Vjb25kcztcblxuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gdGhpcy5jYWxjdWxhdGVEaW1lbnNpb25zKCk7XG4gICAgICAgIGxldCBzY3JvbGwgPSB0aGlzLmNhbGN1bGF0ZVBhZGRpbmcoaW5kZXgsIGRpbWVuc2lvbnMpICsgYWRkaXRpb25hbE9mZnNldDtcbiAgICAgICAgaWYgKCFhbGlnblRvQmVnaW5uaW5nKSB7XG4gICAgICAgICAgICBzY3JvbGwgLT0gZGltZW5zaW9ucy53cmFwR3JvdXBzUGVyUGFnZSAqIGRpbWVuc2lvbnNbdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zY3JvbGxUb1Bvc2l0aW9uKHNjcm9sbCwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjayk7XG4gICAgfVxuXG4gICAgcHVibGljIHNjcm9sbFRvUG9zaXRpb24oc2Nyb2xsUG9zaXRpb246IG51bWJlciwgYW5pbWF0aW9uTWlsbGlzZWNvbmRzPzogbnVtYmVyLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgc2Nyb2xsUG9zaXRpb24gKz0gdGhpcy5nZXRFbGVtZW50c09mZnNldCgpO1xuXG4gICAgICAgIGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9IGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9PT0gdW5kZWZpbmVkID8gdGhpcy5zY3JvbGxBbmltYXRpb25UaW1lIDogYW5pbWF0aW9uTWlsbGlzZWNvbmRzO1xuXG4gICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKTtcblxuICAgICAgICBsZXQgYW5pbWF0aW9uUmVxdWVzdDogbnVtYmVyO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRUd2Vlbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VHdlZW4uc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VHdlZW4gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFuaW1hdGlvbk1pbGxpc2Vjb25kcykge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eShzY3JvbGxFbGVtZW50LCB0aGlzLl9zY3JvbGxUeXBlLCBzY3JvbGxQb3NpdGlvbik7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHR3ZWVuQ29uZmlnT2JqID0ge3Njcm9sbFBvc2l0aW9uOiBzY3JvbGxFbGVtZW50W3RoaXMuX3Njcm9sbFR5cGVdfTtcblxuICAgICAgICBjb25zdCBuZXdUd2VlbiA9IG5ldyB0d2Vlbi5Ud2Vlbih0d2VlbkNvbmZpZ09iailcbiAgICAgICAgICAgIC50byh7c2Nyb2xsUG9zaXRpb259LCBhbmltYXRpb25NaWxsaXNlY29uZHMpXG4gICAgICAgICAgICAuZWFzaW5nKHR3ZWVuLkVhc2luZy5RdWFkcmF0aWMuT3V0KVxuICAgICAgICAgICAgLm9uVXBkYXRlKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKGRhdGEuc2Nyb2xsUG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eShzY3JvbGxFbGVtZW50LCB0aGlzLl9zY3JvbGxUeXBlLCBkYXRhLnNjcm9sbFBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vblN0b3AoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvblJlcXVlc3QpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFuaW1hdGUgPSAodGltZT86IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKCFuZXdUd2Vlbi5pc1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmV3VHdlZW4udXBkYXRlKHRpbWUpO1xuICAgICAgICAgICAgaWYgKHR3ZWVuQ29uZmlnT2JqLnNjcm9sbFBvc2l0aW9uID09PSBzY3JvbGxQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSwgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25SZXF1ZXN0ID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgYW5pbWF0ZSgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUd2VlbiA9IG5ld1R3ZWVuO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRFbGVtZW50U2l6ZShlbGVtZW50OiBIVE1MRWxlbWVudCk6IENsaWVudFJlY3Qge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuICAgICAgICBjb25zdCBtYXJnaW5Ub3AgPSBwYXJzZUludChzdHlsZXNbJ21hcmdpbi10b3AnXSwgMTApIHx8IDA7XG4gICAgICAgIGNvbnN0IG1hcmdpbkJvdHRvbSA9IHBhcnNlSW50KHN0eWxlc1snbWFyZ2luLWJvdHRvbSddLCAxMCkgfHwgMDtcbiAgICAgICAgY29uc3QgbWFyZ2luTGVmdCA9IHBhcnNlSW50KHN0eWxlc1snbWFyZ2luLWxlZnQnXSwgMTApIHx8IDA7XG4gICAgICAgIGNvbnN0IG1hcmdpblJpZ2h0ID0gcGFyc2VJbnQoc3R5bGVzWydtYXJnaW4tcmlnaHQnXSwgMTApIHx8IDA7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogcmVzdWx0LnRvcCArIG1hcmdpblRvcCxcbiAgICAgICAgICAgIGJvdHRvbTogcmVzdWx0LmJvdHRvbSArIG1hcmdpbkJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQ6IHJlc3VsdC5sZWZ0ICsgbWFyZ2luTGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiByZXN1bHQucmlnaHQgKyBtYXJnaW5SaWdodCxcbiAgICAgICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGggKyBtYXJnaW5MZWZ0ICsgbWFyZ2luUmlnaHQsXG4gICAgICAgICAgICBoZWlnaHQ6IHJlc3VsdC5oZWlnaHQgKyBtYXJnaW5Ub3AgKyBtYXJnaW5Cb3R0b21cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYm91bmRpbmdSZWN0ID0gdGhpcy5nZXRFbGVtZW50U2l6ZSh0aGlzLmdldFNjcm9sbEVsZW1lbnQoKSk7XG5cbiAgICAgICAgbGV0IHNpemVDaGFuZ2VkOiBib29sZWFuO1xuICAgICAgICBpZiAoIXRoaXMucHJldmlvdXNTY3JvbGxCb3VuZGluZ1JlY3QpIHtcbiAgICAgICAgICAgIHNpemVDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoQ2hhbmdlID0gTWF0aC5hYnMoYm91bmRpbmdSZWN0LndpZHRoIC0gdGhpcy5wcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdC53aWR0aCk7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHRDaGFuZ2UgPSBNYXRoLmFicyhib3VuZGluZ1JlY3QuaGVpZ2h0IC0gdGhpcy5wcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdC5oZWlnaHQpO1xuICAgICAgICAgICAgc2l6ZUNoYW5nZWQgPSB3aWR0aENoYW5nZSA+IHRoaXMucmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZCB8fCBoZWlnaHRDaGFuZ2UgPiB0aGlzLnJlc2l6ZUJ5cGFzc1JlZnJlc2hUaHJlc2hvbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2l6ZUNoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNTY3JvbGxCb3VuZGluZ1JlY3QgPSBib3VuZGluZ1JlY3Q7XG4gICAgICAgICAgICBpZiAoYm91bmRpbmdSZWN0LndpZHRoID4gMCAmJiBib3VuZGluZ1JlY3QuaGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdXBkYXRlRGlyZWN0aW9uKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGlsZFNjcm9sbERpbSA9ICdjaGlsZFdpZHRoJztcbiAgICAgICAgICAgIHRoaXMuX2ludmlzaWJsZVBhZGRpbmdQcm9wZXJ0eSA9ICdzY2FsZVgnO1xuICAgICAgICAgICAgdGhpcy5fbWFyZ2luRGlyID0gJ21hcmdpbi1sZWZ0JztcbiAgICAgICAgICAgIHRoaXMuX29mZnNldFR5cGUgPSAnb2Zmc2V0TGVmdCc7XG4gICAgICAgICAgICB0aGlzLl9wYWdlT2Zmc2V0VHlwZSA9ICdwYWdlWE9mZnNldCc7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGxUeXBlID0gJ3Njcm9sbExlZnQnO1xuICAgICAgICAgICAgdGhpcy5fdHJhbnNsYXRlRGlyID0gJ3RyYW5zbGF0ZVgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY2hpbGRTY3JvbGxEaW0gPSAnY2hpbGRIZWlnaHQnO1xuICAgICAgICAgICAgdGhpcy5faW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5ID0gJ3NjYWxlWSc7XG4gICAgICAgICAgICB0aGlzLl9tYXJnaW5EaXIgPSAnbWFyZ2luLXRvcCc7XG4gICAgICAgICAgICB0aGlzLl9vZmZzZXRUeXBlID0gJ29mZnNldFRvcCc7XG4gICAgICAgICAgICB0aGlzLl9wYWdlT2Zmc2V0VHlwZSA9ICdwYWdlWU9mZnNldCc7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGxUeXBlID0gJ3Njcm9sbFRvcCc7XG4gICAgICAgICAgICB0aGlzLl90cmFuc2xhdGVEaXIgPSAndHJhbnNsYXRlWSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZGVib3VuY2UoZnVuYzogKCkgPT4gYW55LCB3YWl0OiBudW1iZXIpOiAoKSA9PiBhbnkge1xuICAgICAgICBjb25zdCB0aHJvdHRsZWQgPSB0aGlzLnRocm90dGxlVHJhaWxpbmcoZnVuYywgd2FpdCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICh0aHJvdHRsZWQgYXMgYW55KS5jYW5jZWwoKTtcbiAgICAgICAgICAgIHRocm90dGxlZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICByZXN1bHQuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgKHRocm90dGxlZCBhcyBhbnkpLmNhbmNlbCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHRocm90dGxlVHJhaWxpbmcoZnVuYzogKCkgPT4gYW55LCB3YWl0OiBudW1iZXIpOiAoKSA9PiBhbnkge1xuICAgICAgICBsZXQgdGltZW91dDtcbiAgICAgICAgbGV0IF9hcmd1bWVudHMgPSBhcmd1bWVudHM7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIF9hcmd1bWVudHMgPSBhcmd1bWVudHNcblxuICAgICAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3YWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KF90aGlzLCBfYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KF90aGlzLCBfYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9LCB3YWl0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVzdWx0LmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHRpbWVvdXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVmcmVzaF9pbnRlcm5hbChpdGVtc0FycmF5TW9kaWZpZWQ6IGJvb2xlYW4sIHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaz86ICgpID0+IHZvaWQsIG1heFJ1blRpbWVzOiBudW1iZXIgPSAyKTogdm9pZCB7XG4gICAgICAgIC8vIG5vdGU6IG1heFJ1blRpbWVzIGlzIHRvIGZvcmNlIGl0IHRvIGtlZXAgcmVjYWxjdWxhdGluZyBpZiB0aGUgcHJldmlvdXMgaXRlcmF0aW9uIGNhdXNlZCBhIHJlLXJlbmRlclxuICAgICAgICAvLyAgICAgICAoZGlmZmVyZW50IHNsaWNlZCBpdGVtcyBpbiB2aWV3cG9ydCBvciBzY3JvbGxQb3NpdGlvbiBjaGFuZ2VkKS5cbiAgICAgICAgLy8gVGhlIGRlZmF1bHQgb2YgMnggbWF4IHdpbGwgcHJvYmFibHkgYmUgYWNjdXJhdGUgZW5vdWdoIHdpdGhvdXQgY2F1c2luZyB0b28gbGFyZ2UgYSBwZXJmb3JtYW5jZSBib3R0bGVuZWNrXG4gICAgICAgIC8vIFRoZSBjb2RlIHdvdWxkIHR5cGljYWxseSBxdWl0IG91dCBvbiB0aGUgMm5kIGl0ZXJhdGlvbiBhbnl3YXlzLiBUaGUgbWFpbiB0aW1lIGl0J2QgdGhpbmsgbW9yZSB0aGFuIDIgcnVuc1xuICAgICAgICAvLyB3b3VsZCBiZSBuZWNlc3Nhcnkgd291bGQgYmUgZm9yIHZhc3RseSBkaWZmZXJlbnQgc2l6ZWQgY2hpbGQgaXRlbXMgb3IgaWYgdGhpcyBpcyB0aGUgMXN0IHRpbWUgdGhlIGl0ZW1zIGFycmF5XG4gICAgICAgIC8vIHdhcyBpbml0aWFsaXplZC5cbiAgICAgICAgLy8gV2l0aG91dCBtYXhSdW5UaW1lcywgSWYgdGhlIHVzZXIgaXMgYWN0aXZlbHkgc2Nyb2xsaW5nIHRoaXMgY29kZSB3b3VsZCBiZWNvbWUgYW4gaW5maW5pdGUgbG9vcCB1bnRpbCB0aGV5XG4gICAgICAgIC8vIHN0b3BwZWQgc2Nyb2xsaW5nLiBUaGlzIHdvdWxkIGJlIG9rYXksIGV4Y2VwdCBlYWNoIHNjcm9sbCBldmVudCB3b3VsZCBzdGFydCBhbiBhZGRpdGlvbmFsIGluZmluaXRlIGxvb3AuIFdlXG4gICAgICAgIC8vIHdhbnQgdG8gc2hvcnQtY2lyY3VpdCBpdCB0byBwcmV2ZW50IHRoaXMuXG5cbiAgICAgICAgaWYgKGl0ZW1zQXJyYXlNb2RpZmllZCAmJiB0aGlzLnByZXZpb3VzVmlld1BvcnQgJiYgdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbFN0YXJ0UG9zaXRpb24gPiAwKSB7XG4gICAgICAgICAgICAvLyBpZiBpdGVtcyB3ZXJlIHByZXBlbmRlZCwgc2Nyb2xsIGZvcndhcmQgdG8ga2VlcCBzYW1lIGl0ZW1zIHZpc2libGVcbiAgICAgICAgICAgIGNvbnN0IG9sZFZpZXdQb3J0ID0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0O1xuICAgICAgICAgICAgY29uc3Qgb2xkVmlld1BvcnRJdGVtcyA9IHRoaXMudmlld1BvcnRJdGVtcztcblxuXHRcdFx0Y29uc3Qgb2xkUmVmcmVzaENvbXBsZXRlZENhbGxiYWNrID0gcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrO1xuXHRcdFx0cmVmcmVzaENvbXBsZXRlZENhbGxiYWNrID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBzY3JvbGxMZW5ndGhEZWx0YSA9IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxMZW5ndGggLSBvbGRWaWV3UG9ydC5zY3JvbGxMZW5ndGg7XG5cdFx0XHRcdGlmIChzY3JvbGxMZW5ndGhEZWx0YSA+IDAgJiYgdGhpcy52aWV3UG9ydEl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4IC0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXhXaXRoQnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRTdGFydEl0ZW0gPSBvbGRWaWV3UG9ydEl0ZW1zW29mZnNldF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBvbGRTdGFydEl0ZW1JbmRleCA9IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMCwgbCA9IHRoaXMuaXRlbXMsIG4gPSB0aGlzLml0ZW1zLmxlbmd0aDsgaSA8IG47IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbXBhcmVJdGVtcyhvbGRTdGFydEl0ZW0sIGxbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkU3RhcnRJdGVtSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFN0YXJ0SXRlbUluZGV4ID4gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpdGVtT3JkZXJDaGFuZ2VkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxLCBsID0gdGhpcy52aWV3UG9ydEl0ZW1zLmxlbmd0aCAtIG9mZnNldDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5jb21wYXJlSXRlbXModGhpcy5pdGVtc1tvbGRTdGFydEl0ZW1JbmRleCArIGldLCBvbGRWaWV3UG9ydEl0ZW1zW29mZnNldCArIGldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtT3JkZXJDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW1PcmRlckNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvUG9zaXRpb24odGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbFN0YXJ0UG9zaXRpb24gKyBzY3JvbGxMZW5ndGhEZWx0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgb2xkUmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob2xkUmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZFJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtc0FycmF5TW9kaWZpZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNldFdyYXBHcm91cERpbWVuc2lvbnMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgdmlld3BvcnQgPSB0aGlzLmNhbGN1bGF0ZVZpZXdwb3J0KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydENoYW5nZWQgPSBpdGVtc0FycmF5TW9kaWZpZWQgfHwgdmlld3BvcnQuc3RhcnRJbmRleCAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXg7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kQ2hhbmdlZCA9IGl0ZW1zQXJyYXlNb2RpZmllZCB8fCB2aWV3cG9ydC5lbmRJbmRleCAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LmVuZEluZGV4O1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbExlbmd0aENoYW5nZWQgPSB2aWV3cG9ydC5zY3JvbGxMZW5ndGggIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFkZGluZ0NoYW5nZWQgPSB2aWV3cG9ydC5wYWRkaW5nICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQucGFkZGluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JvbGxQb3NpdGlvbkNoYW5nZWQgPSB2aWV3cG9ydC5zY3JvbGxTdGFydFBvc2l0aW9uICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc2Nyb2xsU3RhcnRQb3NpdGlvbiB8fFxuICAgICAgICAgICAgICAgICAgICB2aWV3cG9ydC5zY3JvbGxFbmRQb3NpdGlvbiAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbEVuZFBvc2l0aW9uIHx8XG4gICAgICAgICAgICAgICAgICAgIHZpZXdwb3J0Lm1heFNjcm9sbFBvc2l0aW9uICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQubWF4U2Nyb2xsUG9zaXRpb247XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpb3VzVmlld1BvcnQgPSB2aWV3cG9ydDtcblxuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxMZW5ndGhDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5pbnZpc2libGVQYWRkaW5nRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAndHJhbnNmb3JtJywgYCR7dGhpcy5faW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5fSgke3ZpZXdwb3J0LnNjcm9sbExlbmd0aH0pYCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5pbnZpc2libGVQYWRkaW5nRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2Via2l0VHJhbnNmb3JtJywgYCR7dGhpcy5faW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5fSgke3ZpZXdwb3J0LnNjcm9sbExlbmd0aH0pYCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHBhZGRpbmdDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnVzZU1hcmdpbkluc3RlYWRPZlRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmNvbnRlbnRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIHRoaXMuX21hcmdpbkRpciwgYCR7dmlld3BvcnQucGFkZGluZ31weGApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmNvbnRlbnRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd0cmFuc2Zvcm0nLCBgJHt0aGlzLl90cmFuc2xhdGVEaXJ9KCR7dmlld3BvcnQucGFkZGluZ31weClgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5jb250ZW50RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2Via2l0VHJhbnNmb3JtJywgYCR7dGhpcy5fdHJhbnNsYXRlRGlyfSgke3ZpZXdwb3J0LnBhZGRpbmd9cHgpYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oZWFkZXJFbGVtZW50UmVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KClbdGhpcy5fc2Nyb2xsVHlwZV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lck9mZnNldCA9IHRoaXMuZ2V0RWxlbWVudHNPZmZzZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gTWF0aC5tYXgoc2Nyb2xsUG9zaXRpb24gLSB2aWV3cG9ydC5wYWRkaW5nIC0gY29udGFpbmVyT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWVudEhlaWdodCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5oZWFkZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd0cmFuc2Zvcm0nLCBgJHt0aGlzLl90cmFuc2xhdGVEaXJ9KCR7b2Zmc2V0fXB4KWApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuaGVhZGVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnd2Via2l0VHJhbnNmb3JtJywgYCR7dGhpcy5fdHJhbnNsYXRlRGlyfSgke29mZnNldH1weClgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VFdmVudEFyZzogSVBhZ2VJbmZvID0gKHN0YXJ0Q2hhbmdlZCB8fCBlbmRDaGFuZ2VkKSA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleDogdmlld3BvcnQuc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXg6IHZpZXdwb3J0LmVuZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uOiB2aWV3cG9ydC5zY3JvbGxTdGFydFBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFbmRQb3NpdGlvbjogdmlld3BvcnQuc2Nyb2xsRW5kUG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyOiB2aWV3cG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXhXaXRoQnVmZmVyOiB2aWV3cG9ydC5lbmRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICAgICAgICAgIG1heFNjcm9sbFBvc2l0aW9uOiB2aWV3cG9ydC5tYXhTY3JvbGxQb3NpdGlvblxuICAgICAgICAgICAgICAgIH0gOiB1bmRlZmluZWQ7XG5cblxuICAgICAgICAgICAgICAgIGlmIChzdGFydENoYW5nZWQgfHwgZW5kQ2hhbmdlZCB8fCBzY3JvbGxQb3NpdGlvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlQ2hhbmdlZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc2Nyb2xsIGxpc3QgdG8gdHJpZ2dlciByZS1yZW5kZXIgb2YgY29tcG9uZW50cyBpbiB2aWV3cG9ydFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3UG9ydEl0ZW1zID0gdmlld3BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXIgPj0gMCAmJiB2aWV3cG9ydC5lbmRJbmRleFdpdGhCdWZmZXIgPj0gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5zbGljZSh2aWV3cG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlciwgdmlld3BvcnQuZW5kSW5kZXhXaXRoQnVmZmVyICsgMSkgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnNVcGRhdGUuZW1pdCh0aGlzLnZpZXdQb3J0SXRlbXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52c1N0YXJ0LmVtaXQoY2hhbmdlRXZlbnRBcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnNFbmQuZW1pdChjaGFuZ2VFdmVudEFyZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydENoYW5nZWQgfHwgZW5kQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52c0NoYW5nZS5lbWl0KGNoYW5nZUV2ZW50QXJnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heFJ1blRpbWVzID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSwgcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrLCBtYXhSdW5UaW1lcyAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXhlY3V0ZVJlZnJlc2hPdXRzaWRlQW5ndWxhclpvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNoYW5nZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oaGFuZGxlQ2hhbmdlZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF4UnVuVGltZXMgPiAwICYmIChzY3JvbGxMZW5ndGhDaGFuZ2VkIHx8IHBhZGRpbmdDaGFuZ2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlLCByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2ssIG1heFJ1blRpbWVzIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0U2Nyb2xsRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudFNjcm9sbCBpbnN0YW5jZW9mIFdpbmRvdyA/IGRvY3VtZW50LnNjcm9sbGluZ0VsZW1lbnQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5IDogdGhpcy5wYXJlbnRTY3JvbGwgfHwgdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFkZFNjcm9sbEV2ZW50SGFuZGxlcnMoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5ndWxhclVuaXZlcnNhbFNTUikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuXG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsRXZlbnRIYW5kbGVycygpO1xuXG4gICAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oJ3dpbmRvdycsICdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VSZXNpemVIYW5kbGVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oJ3dpbmRvdycsICdyZXNpemUnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlU2Nyb2xsSGFuZGxlciA9IHRoaXMucmVuZGVyZXIubGlzdGVuKHNjcm9sbEVsZW1lbnQsICdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkVGltZXIgPSAoc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMuX2NoZWNrUmVzaXplSW50ZXJ2YWwpIGFzIGFueSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVtb3ZlU2Nyb2xsRXZlbnRIYW5kbGVycygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZFRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuY2hlY2tTY3JvbGxFbGVtZW50UmVzaXplZFRpbWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zZVJlc2l6ZUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZVJlc2l6ZUhhbmRsZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZVJlc2l6ZUhhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0RWxlbWVudHNPZmZzZXQoKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmd1bGFyVW5pdmVyc2FsU1NSKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvZmZzZXQgPSAwO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYgJiYgdGhpcy5jb250YWluZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudFt0aGlzLl9vZmZzZXRUeXBlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcmVudFNjcm9sbCkge1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudENsaWVudFJlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbENsaWVudFJlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKHNjcm9sbEVsZW1lbnQpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBlbGVtZW50Q2xpZW50UmVjdC5sZWZ0IC0gc2Nyb2xsQ2xpZW50UmVjdC5sZWZ0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gZWxlbWVudENsaWVudFJlY3QudG9wIC0gc2Nyb2xsQ2xpZW50UmVjdC50b3A7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghKHRoaXMucGFyZW50U2Nyb2xsIGluc3RhbmNlb2YgV2luZG93KSkge1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBzY3JvbGxFbGVtZW50W3RoaXMuX3Njcm9sbFR5cGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY291bnRJdGVtc1BlcldyYXBHcm91cCgpOiBudW1iZXIge1xuICAgICAgICBpZiAodGhpcy5pc0FuZ3VsYXJVbml2ZXJzYWxTU1IpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuaG9yaXpvbnRhbCA/IHRoaXMuc3NyVmlld3BvcnRIZWlnaHQgLyB0aGlzLnNzckNoaWxkSGVpZ2h0IDogdGhpcy5zc3JWaWV3cG9ydFdpZHRoIC8gdGhpcy5zc3JDaGlsZFdpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHRoaXMuaG9yaXpvbnRhbCA/ICdvZmZzZXRMZWZ0JyA6ICdvZmZzZXRUb3AnO1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9ICgodGhpcy5jb250YWluZXJFbGVtZW50UmVmICYmIHRoaXMuY29udGFpbmVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSB8fFxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KS5jaGlsZHJlbjtcblxuICAgICAgICBjb25zdCBjaGlsZHJlbkxlbmd0aCA9IGNoaWxkcmVuID8gY2hpbGRyZW4ubGVuZ3RoIDogMDtcbiAgICAgICAgaWYgKGNoaWxkcmVuTGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpcnN0T2Zmc2V0ID0gY2hpbGRyZW5bMF1bcHJvcGVydHlOYW1lXTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IDE7XG4gICAgICAgIHdoaWxlIChyZXN1bHQgPCBjaGlsZHJlbkxlbmd0aCAmJiBmaXJzdE9mZnNldCA9PT0gY2hpbGRyZW5bcmVzdWx0XVtwcm9wZXJ0eU5hbWVdKSB7XG4gICAgICAgICAgICArK3Jlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldFNjcm9sbFN0YXJ0UG9zaXRpb24oKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IHdpbmRvd1Njcm9sbFZhbHVlO1xuICAgICAgICBpZiAodGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cpIHtcbiAgICAgICAgICAgIHdpbmRvd1Njcm9sbFZhbHVlID0gd2luZG93W3RoaXMuX3BhZ2VPZmZzZXRUeXBlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3aW5kb3dTY3JvbGxWYWx1ZSB8fCB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKVt0aGlzLl9zY3JvbGxUeXBlXSB8fCAwO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCByZXNldFdyYXBHcm91cERpbWVuc2lvbnMoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9sZFdyYXBHcm91cERpbWVuc2lvbnMgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnM7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZUFsbENhY2hlZE1lYXN1cmVtZW50cygpO1xuXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcyB8fCAhb2xkV3JhcEdyb3VwRGltZW5zaW9ucyB8fCBvbGRXcmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtc1BlcldyYXBHcm91cDogbnVtYmVyID0gdGhpcy5jb3VudEl0ZW1zUGVyV3JhcEdyb3VwKCk7XG4gICAgICAgIGZvciAobGV0IHdyYXBHcm91cEluZGV4ID0gMDsgd3JhcEdyb3VwSW5kZXggPCBvbGRXcmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cC5sZW5ndGg7ICsrd3JhcEdyb3VwSW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IG9sZFdyYXBHcm91cERpbWVuc2lvbjogV3JhcEdyb3VwRGltZW5zaW9uID0gb2xkV3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbd3JhcEdyb3VwSW5kZXhdO1xuICAgICAgICAgICAgaWYgKCFvbGRXcmFwR3JvdXBEaW1lbnNpb24gfHwgIW9sZFdyYXBHcm91cERpbWVuc2lvbi5pdGVtcyB8fCAhb2xkV3JhcEdyb3VwRGltZW5zaW9uLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2xkV3JhcEdyb3VwRGltZW5zaW9uLml0ZW1zLmxlbmd0aCAhPT0gaXRlbXNQZXJXcmFwR3JvdXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBpdGVtc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGFycmF5U3RhcnRJbmRleCA9IGl0ZW1zUGVyV3JhcEdyb3VwICogd3JhcEdyb3VwSW5kZXg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zUGVyV3JhcEdyb3VwOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY29tcGFyZUl0ZW1zKG9sZFdyYXBHcm91cERpbWVuc2lvbi5pdGVtc1tpXSwgdGhpcy5pdGVtc1thcnJheVN0YXJ0SW5kZXggKyBpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWl0ZW1zQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICsrdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHMgKz0gb2xkV3JhcEdyb3VwRGltZW5zaW9uLmNoaWxkV2lkdGggfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0cyArPSBvbGRXcmFwR3JvdXBEaW1lbnNpb24uY2hpbGRIZWlnaHQgfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW3dyYXBHcm91cEluZGV4XSA9IG9sZFdyYXBHcm91cERpbWVuc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVEaW1lbnNpb25zKCk6IElEaW1lbnNpb25zIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuXG4gICAgICAgIGNvbnN0IG1heENhbGN1bGF0ZWRTY3JvbGxCYXJTaXplID0gMjU7IC8vIE5vdGU6IEZvcm11bGEgdG8gYXV0by1jYWxjdWxhdGUgZG9lc24ndCB3b3JrIGZvciBQYXJlbnRTY3JvbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgIHNvIHdlIGRlZmF1bHQgdG8gdGhpcyBpZiBub3Qgc2V0IGJ5IGNvbnN1bWluZyBhcHBsaWNhdGlvblxuICAgICAgICB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJIZWlnaHQgPSBNYXRoLm1heChNYXRoLm1pbihzY3JvbGxFbGVtZW50Lm9mZnNldEhlaWdodCAtIHNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUpLCB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJIZWlnaHQpO1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJXaWR0aCA9IE1hdGgubWF4KE1hdGgubWluKHNjcm9sbEVsZW1lbnQub2Zmc2V0V2lkdGggLSBzY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUpLCB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJXaWR0aCk7XG5cbiAgICAgICAgbGV0IHZpZXdwb3J0V2lkdGggPSBzY3JvbGxFbGVtZW50Lm9mZnNldFdpZHRoIC0gKHRoaXMuc2Nyb2xsYmFyV2lkdGggfHwgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFyV2lkdGggfHxcbiAgICAgICAgICAgICh0aGlzLmhvcml6b250YWwgPyAwIDogbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUpKTtcbiAgICAgICAgbGV0IHZpZXdwb3J0SGVpZ2h0ID0gc2Nyb2xsRWxlbWVudC5vZmZzZXRIZWlnaHQgLSAodGhpcy5zY3JvbGxiYXJIZWlnaHQgfHwgdGhpcy5jYWxjdWxhdGVkU2Nyb2xsYmFySGVpZ2h0IHx8XG4gICAgICAgICAgICAodGhpcy5ob3Jpem9udGFsID8gbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUgOiAwKSk7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9ICh0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYgJiYgdGhpcy5jb250YWluZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpIHx8IHRoaXMuY29udGVudEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgICBjb25zdCBpdGVtc1BlcldyYXBHcm91cCA9IHRoaXMuY291bnRJdGVtc1BlcldyYXBHcm91cCgpO1xuICAgICAgICBsZXQgd3JhcEdyb3Vwc1BlclBhZ2U7XG5cbiAgICAgICAgbGV0IGRlZmF1bHRDaGlsZFdpZHRoO1xuICAgICAgICBsZXQgZGVmYXVsdENoaWxkSGVpZ2h0O1xuXG4gICAgICAgIGlmICh0aGlzLmlzQW5ndWxhclVuaXZlcnNhbFNTUikge1xuICAgICAgICAgICAgdmlld3BvcnRXaWR0aCA9IHRoaXMuc3NyVmlld3BvcnRXaWR0aDtcbiAgICAgICAgICAgIHZpZXdwb3J0SGVpZ2h0ID0gdGhpcy5zc3JWaWV3cG9ydEhlaWdodDtcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZFdpZHRoID0gdGhpcy5zc3JDaGlsZFdpZHRoO1xuICAgICAgICAgICAgZGVmYXVsdENoaWxkSGVpZ2h0ID0gdGhpcy5zc3JDaGlsZEhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gTWF0aC5tYXgoTWF0aC5jZWlsKHZpZXdwb3J0V2lkdGggLyBkZWZhdWx0Q2hpbGRXaWR0aCksIDEpO1xuICAgICAgICAgICAgY29uc3QgaXRlbXNQZXJDb2wgPSBNYXRoLm1heChNYXRoLmNlaWwodmlld3BvcnRIZWlnaHQgLyBkZWZhdWx0Q2hpbGRIZWlnaHQpLCAxKTtcbiAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlID0gdGhpcy5ob3Jpem9udGFsID8gaXRlbXNQZXJSb3cgOiBpdGVtc1BlckNvbDtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgaWYgKGNvbnRlbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jaGlsZFdpZHRoIHx8ICF0aGlzLmNoaWxkSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggJiYgdmlld3BvcnRXaWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gdmlld3BvcnRXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCAmJiB2aWV3cG9ydEhlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCA9IHZpZXdwb3J0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjb250ZW50LmNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IE1hdGgubWluKHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoLCBjbGllbnRSZWN0LndpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSBNYXRoLm1pbih0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQsIGNsaWVudFJlY3QuaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVmYXVsdENoaWxkV2lkdGggPSB0aGlzLmNoaWxkV2lkdGggfHwgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggfHwgdmlld3BvcnRXaWR0aDtcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZEhlaWdodCA9IHRoaXMuY2hpbGRIZWlnaHQgfHwgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0IHx8IHZpZXdwb3J0SGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgaXRlbXNQZXJSb3cgPSBNYXRoLm1heChNYXRoLmNlaWwodmlld3BvcnRXaWR0aCAvIGRlZmF1bHRDaGlsZFdpZHRoKSwgMSk7XG4gICAgICAgICAgICBjb25zdCBpdGVtc1BlckNvbCA9IE1hdGgubWF4KE1hdGguY2VpbCh2aWV3cG9ydEhlaWdodCAvIGRlZmF1bHRDaGlsZEhlaWdodCksIDEpO1xuICAgICAgICAgICAgd3JhcEdyb3Vwc1BlclBhZ2UgPSB0aGlzLmhvcml6b250YWwgPyBpdGVtc1BlclJvdyA6IGl0ZW1zUGVyQ29sO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjcm9sbE9mZnNldCA9IHNjcm9sbEVsZW1lbnRbdGhpcy5fc2Nyb2xsVHlwZV0gLSAodGhpcy5wcmV2aW91c1ZpZXdQb3J0ID8gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnBhZGRpbmcgOiAwKTtcblxuICAgICAgICAgICAgbGV0IGFycmF5U3RhcnRJbmRleCA9IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlciB8fCAwO1xuICAgICAgICAgICAgbGV0IHdyYXBHcm91cEluZGV4ID0gTWF0aC5jZWlsKGFycmF5U3RhcnRJbmRleCAvIGl0ZW1zUGVyV3JhcEdyb3VwKTtcblxuICAgICAgICAgICAgbGV0IG1heFdpZHRoRm9yV3JhcEdyb3VwID0gMDtcbiAgICAgICAgICAgIGxldCBtYXhIZWlnaHRGb3JXcmFwR3JvdXAgPSAwO1xuICAgICAgICAgICAgbGV0IHN1bU9mVmlzaWJsZU1heFdpZHRocyA9IDA7XG4gICAgICAgICAgICBsZXQgc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cyA9IDA7XG4gICAgICAgICAgICB3cmFwR3JvdXBzUGVyUGFnZSA9IDA7XG5cbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItZm9yLW9mXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRlbnQuY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICArK2FycmF5U3RhcnRJbmRleDtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IGNvbnRlbnQuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHRoaXMuZ2V0RWxlbWVudFNpemUoY2hpbGQpO1xuXG4gICAgICAgICAgICAgICAgbWF4V2lkdGhGb3JXcmFwR3JvdXAgPSBNYXRoLm1heChtYXhXaWR0aEZvcldyYXBHcm91cCwgY2xpZW50UmVjdC53aWR0aCk7XG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwID0gTWF0aC5tYXgobWF4SGVpZ2h0Rm9yV3JhcEdyb3VwLCBjbGllbnRSZWN0LmhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJyYXlTdGFydEluZGV4ICUgaXRlbXNQZXJXcmFwR3JvdXAgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW3dyYXBHcm91cEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAtLXRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHMgLT0gb2xkVmFsdWUuY2hpbGRXaWR0aCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgLT0gb2xkVmFsdWUuY2hpbGRIZWlnaHQgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICsrdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuaXRlbXMuc2xpY2UoYXJyYXlTdGFydEluZGV4IC0gaXRlbXNQZXJXcmFwR3JvdXAsIGFycmF5U3RhcnRJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbd3JhcEdyb3VwSW5kZXhdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRXaWR0aDogbWF4V2lkdGhGb3JXcmFwR3JvdXAsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZEhlaWdodDogbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRocyArPSBtYXhXaWR0aEZvcldyYXBHcm91cDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgKz0gbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhvcml6b250YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXAgPSBNYXRoLm1pbihtYXhXaWR0aEZvcldyYXBHcm91cCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCh2aWV3cG9ydFdpZHRoIC0gc3VtT2ZWaXNpYmxlTWF4V2lkdGhzLCAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbE9mZnNldFRvUmVtb3ZlID0gTWF0aC5taW4oc2Nyb2xsT2Zmc2V0LCBtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFZpc2libGVXaWR0aEZvcldyYXBHcm91cCAtPSBzY3JvbGxPZmZzZXRUb1JlbW92ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQgLT0gc2Nyb2xsT2Zmc2V0VG9SZW1vdmU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bU9mVmlzaWJsZU1heFdpZHRocyArPSBtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXA7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4VmlzaWJsZVdpZHRoRm9yV3JhcEdyb3VwID4gMCAmJiB2aWV3cG9ydFdpZHRoID49IHN1bU9mVmlzaWJsZU1heFdpZHRocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrd3JhcEdyb3Vwc1BlclBhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWF4VmlzaWJsZUhlaWdodEZvcldyYXBHcm91cCA9IE1hdGgubWluKG1heEhlaWdodEZvcldyYXBHcm91cCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCh2aWV3cG9ydEhlaWdodCAtIHN1bU9mVmlzaWJsZU1heEhlaWdodHMsIDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsT2Zmc2V0VG9SZW1vdmUgPSBNYXRoLm1pbihzY3JvbGxPZmZzZXQsIG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXAgLT0gc2Nyb2xsT2Zmc2V0VG9SZW1vdmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IHNjcm9sbE9mZnNldFRvUmVtb3ZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1PZlZpc2libGVNYXhIZWlnaHRzICs9IG1heFZpc2libGVIZWlnaHRGb3JXcmFwR3JvdXA7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4VmlzaWJsZUhlaWdodEZvcldyYXBHcm91cCA+IDAgJiYgdmlld3BvcnRIZWlnaHQgPj0gc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrd3JhcEdyb3Vwc1BlclBhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICArK3dyYXBHcm91cEluZGV4O1xuXG4gICAgICAgICAgICAgICAgICAgIG1heFdpZHRoRm9yV3JhcEdyb3VwID0gMDtcbiAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0Rm9yV3JhcEdyb3VwID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGF2ZXJhZ2VDaGlsZFdpZHRoID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRocyAvXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgY29uc3QgYXZlcmFnZUNoaWxkSGVpZ2h0ID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZEhlaWdodHMgL1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5udW1iZXJPZktub3duV3JhcEdyb3VwQ2hpbGRTaXplcztcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZFdpZHRoID0gdGhpcy5jaGlsZFdpZHRoIHx8IGF2ZXJhZ2VDaGlsZFdpZHRoIHx8IHZpZXdwb3J0V2lkdGg7XG4gICAgICAgICAgICBkZWZhdWx0Q2hpbGRIZWlnaHQgPSB0aGlzLmNoaWxkSGVpZ2h0IHx8IGF2ZXJhZ2VDaGlsZEhlaWdodCB8fCB2aWV3cG9ydEhlaWdodDtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgIGlmICh2aWV3cG9ydFdpZHRoID4gc3VtT2ZWaXNpYmxlTWF4V2lkdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlICs9IE1hdGguY2VpbCgodmlld3BvcnRXaWR0aCAtIHN1bU9mVmlzaWJsZU1heFdpZHRocykgLyBkZWZhdWx0Q2hpbGRXaWR0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodmlld3BvcnRIZWlnaHQgPiBzdW1PZlZpc2libGVNYXhIZWlnaHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlICs9IE1hdGguY2VpbCgodmlld3BvcnRIZWlnaHQgLSBzdW1PZlZpc2libGVNYXhIZWlnaHRzKSAvIGRlZmF1bHRDaGlsZEhlaWdodCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXRlbUNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGl0ZW1zUGVyUGFnZSA9IGl0ZW1zUGVyV3JhcEdyb3VwICogd3JhcEdyb3Vwc1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IHBhZ2VDb3VudEZyYWN0aW9uYWwgPSBpdGVtQ291bnQgLyBpdGVtc1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IG51bWJlck9mV3JhcEdyb3VwcyA9IE1hdGguY2VpbChpdGVtQ291bnQgLyBpdGVtc1BlcldyYXBHcm91cCk7XG5cbiAgICAgICAgbGV0IHNjcm9sbExlbmd0aCA9IDA7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCA9IHRoaXMuaG9yaXpvbnRhbCA/IGRlZmF1bHRDaGlsZFdpZHRoIDogZGVmYXVsdENoaWxkSGVpZ2h0O1xuICAgICAgICBpZiAodGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgbGV0IG51bVVua25vd25DaGlsZFNpemVzID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZXcmFwR3JvdXBzOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZFNpemUgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2ldICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV1bdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZFNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IGNoaWxkU2l6ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICArK251bVVua25vd25DaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IE1hdGgucm91bmQobnVtVW5rbm93bkNoaWxkU2l6ZXMgKiBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aCA9IG51bWJlck9mV3JhcEdyb3VwcyAqIGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5oZWFkZXJFbGVtZW50UmVmKSB7XG4gICAgICAgICAgICBzY3JvbGxMZW5ndGggKz0gdGhpcy5oZWFkZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgdmlld3BvcnRMZW5ndGggPSB0aGlzLmhvcml6b250YWwgPyB2aWV3cG9ydFdpZHRoIDogdmlld3BvcnRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IG1heFNjcm9sbFBvc2l0aW9uID0gTWF0aC5tYXgoc2Nyb2xsTGVuZ3RoIC0gdmlld3BvcnRMZW5ndGgsIDApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjaGlsZEhlaWdodDogZGVmYXVsdENoaWxkSGVpZ2h0LFxuICAgICAgICAgICAgY2hpbGRXaWR0aDogZGVmYXVsdENoaWxkV2lkdGgsXG4gICAgICAgICAgICBpdGVtQ291bnQsXG4gICAgICAgICAgICBpdGVtc1BlclBhZ2UsXG4gICAgICAgICAgICBpdGVtc1BlcldyYXBHcm91cCxcbiAgICAgICAgICAgIG1heFNjcm9sbFBvc2l0aW9uLFxuICAgICAgICAgICAgcGFnZUNvdW50X2ZyYWN0aW9uYWw6IHBhZ2VDb3VudEZyYWN0aW9uYWwsXG4gICAgICAgICAgICBzY3JvbGxMZW5ndGgsXG4gICAgICAgICAgICB2aWV3cG9ydExlbmd0aCxcbiAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVQYWRkaW5nKGFycmF5U3RhcnRJbmRleFdpdGhCdWZmZXI6IG51bWJlciwgZGltZW5zaW9uczogSURpbWVuc2lvbnMpOiBudW1iZXIge1xuICAgICAgICBpZiAoZGltZW5zaW9ucy5pdGVtQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCA9IGRpbWVuc2lvbnNbdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICBjb25zdCBzdGFydGluZ1dyYXBHcm91cEluZGV4ID0gTWF0aC5mbG9vcihhcnJheVN0YXJ0SW5kZXhXaXRoQnVmZmVyIC8gZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cCkgfHwgMDtcblxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwICogc3RhcnRpbmdXcmFwR3JvdXBJbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBudW1Vbmtub3duQ2hpbGRTaXplcyA9IDA7XG4gICAgICAgIGxldCByZXN1bHQgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YXJ0aW5nV3JhcEdyb3VwSW5kZXg7ICsraSkge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRTaXplID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXSAmJlxuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV1bdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICAgICAgaWYgKGNoaWxkU2l6ZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjaGlsZFNpemU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrbnVtVW5rbm93bkNoaWxkU2l6ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IE1hdGgucm91bmQobnVtVW5rbm93bkNoaWxkU2l6ZXMgKiBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVQYWdlSW5mbyhzY3JvbGxQb3NpdGlvbjogbnVtYmVyLCBkaW1lbnNpb25zOiBJRGltZW5zaW9ucyk6IElQYWdlSW5mbyB7XG4gICAgICAgIGxldCBzY3JvbGxQZXJjZW50YWdlID0gMDtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG51bWJlck9mV3JhcEdyb3VwcyA9IE1hdGguY2VpbChkaW1lbnNpb25zLml0ZW1Db3VudCAvIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXApO1xuICAgICAgICAgICAgbGV0IHRvdGFsU2Nyb2xsZWRMZW5ndGggPSAwO1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cCA9IGRpbWVuc2lvbnNbdGhpcy5fY2hpbGRTY3JvbGxEaW1dO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZldyYXBHcm91cHM7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkU2l6ZSA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV0gJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXVt0aGlzLl9jaGlsZFNjcm9sbERpbV07XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFNjcm9sbGVkTGVuZ3RoICs9IGNoaWxkU2l6ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFNjcm9sbGVkTGVuZ3RoICs9IGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbFBvc2l0aW9uIDwgdG90YWxTY3JvbGxlZExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxQZXJjZW50YWdlID0gaSAvIG51bWJlck9mV3JhcEdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsUGVyY2VudGFnZSA9IHNjcm9sbFBvc2l0aW9uIC8gZGltZW5zaW9ucy5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGFydGluZ0FycmF5SW5kZXhGcmFjdGlvbmFsID0gTWF0aC5taW4oTWF0aC5tYXgoc2Nyb2xsUGVyY2VudGFnZSAqIGRpbWVuc2lvbnMucGFnZUNvdW50X2ZyYWN0aW9uYWwsIDApLFxuICAgICAgICAgICAgZGltZW5zaW9ucy5wYWdlQ291bnRfZnJhY3Rpb25hbCkgKiBkaW1lbnNpb25zLml0ZW1zUGVyUGFnZTtcblxuICAgICAgICBjb25zdCBtYXhTdGFydCA9IGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gZGltZW5zaW9ucy5pdGVtc1BlclBhZ2UgLSAxO1xuICAgICAgICBsZXQgYXJyYXlTdGFydEluZGV4ID0gTWF0aC5taW4oTWF0aC5mbG9vcihzdGFydGluZ0FycmF5SW5kZXhGcmFjdGlvbmFsKSwgbWF4U3RhcnQpO1xuICAgICAgICBhcnJheVN0YXJ0SW5kZXggLT0gYXJyYXlTdGFydEluZGV4ICUgZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cDsgLy8gcm91bmQgZG93biB0byBzdGFydCBvZiB3cmFwR3JvdXBcblxuICAgICAgICBpZiAodGhpcy5zdHJpcGVkVGFibGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlckJvdW5kYXJ5ID0gMiAqIGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXA7XG4gICAgICAgICAgICBpZiAoYXJyYXlTdGFydEluZGV4ICUgYnVmZmVyQm91bmRhcnkgIT09IDApIHtcbiAgICAgICAgICAgICAgICBhcnJheVN0YXJ0SW5kZXggPSBNYXRoLm1heChhcnJheVN0YXJ0SW5kZXggLSBhcnJheVN0YXJ0SW5kZXggJSBidWZmZXJCb3VuZGFyeSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYXJyYXlFbmRJbmRleCA9IE1hdGguY2VpbChzdGFydGluZ0FycmF5SW5kZXhGcmFjdGlvbmFsKSArIGRpbWVuc2lvbnMuaXRlbXNQZXJQYWdlIC0gMTtcbiAgICAgICAgY29uc3QgZW5kSW5kZXhXaXRoaW5XcmFwR3JvdXAgPSAoYXJyYXlFbmRJbmRleCArIDEpICUgZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cDtcbiAgICAgICAgaWYgKGVuZEluZGV4V2l0aGluV3JhcEdyb3VwID4gMCkge1xuICAgICAgICAgICAgYXJyYXlFbmRJbmRleCArPSBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwIC0gZW5kSW5kZXhXaXRoaW5XcmFwR3JvdXA7IC8vIHJvdW5kIHVwIHRvIGVuZCBvZiB3cmFwR3JvdXBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc05hTihhcnJheVN0YXJ0SW5kZXgpKSB7XG4gICAgICAgICAgICBhcnJheVN0YXJ0SW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc05hTihhcnJheUVuZEluZGV4KSkge1xuICAgICAgICAgICAgYXJyYXlFbmRJbmRleCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheVN0YXJ0SW5kZXggPSBNYXRoLm1pbihNYXRoLm1heChhcnJheVN0YXJ0SW5kZXgsIDApLCBkaW1lbnNpb25zLml0ZW1Db3VudCAtIDEpO1xuICAgICAgICBhcnJheUVuZEluZGV4ID0gTWF0aC5taW4oTWF0aC5tYXgoYXJyYXlFbmRJbmRleCwgMCksIGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gMSk7XG5cbiAgICAgICAgY29uc3QgYnVmZmVyU2l6ZSA9IHRoaXMuYnVmZmVyQW1vdW50ICogZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cDtcbiAgICAgICAgY29uc3Qgc3RhcnRJbmRleFdpdGhCdWZmZXIgPSBNYXRoLm1pbihNYXRoLm1heChhcnJheVN0YXJ0SW5kZXggLSBidWZmZXJTaXplLCAwKSwgZGltZW5zaW9ucy5pdGVtQ291bnQgLSAxKTtcbiAgICAgICAgY29uc3QgZW5kSW5kZXhXaXRoQnVmZmVyID0gTWF0aC5taW4oTWF0aC5tYXgoYXJyYXlFbmRJbmRleCArIGJ1ZmZlclNpemUsIDApLCBkaW1lbnNpb25zLml0ZW1Db3VudCAtIDEpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydEluZGV4OiBhcnJheVN0YXJ0SW5kZXgsXG4gICAgICAgICAgICBlbmRJbmRleDogYXJyYXlFbmRJbmRleCxcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgZW5kSW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbjogc2Nyb2xsUG9zaXRpb24sXG4gICAgICAgICAgICBzY3JvbGxFbmRQb3NpdGlvbjogc2Nyb2xsUG9zaXRpb24gKyBkaW1lbnNpb25zLnZpZXdwb3J0TGVuZ3RoLFxuICAgICAgICAgICAgbWF4U2Nyb2xsUG9zaXRpb246IGRpbWVuc2lvbnMubWF4U2Nyb2xsUG9zaXRpb25cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY2FsY3VsYXRlVmlld3BvcnQoKTogSVZpZXdwb3J0IHtcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IHRoaXMuY2FsY3VsYXRlRGltZW5zaW9ucygpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmdldEVsZW1lbnRzT2Zmc2V0KCk7XG5cbiAgICAgICAgbGV0IHNjcm9sbFN0YXJ0UG9zaXRpb24gPSB0aGlzLmdldFNjcm9sbFN0YXJ0UG9zaXRpb24oKTtcbiAgICAgICAgaWYgKHNjcm9sbFN0YXJ0UG9zaXRpb24gPiAoZGltZW5zaW9ucy5zY3JvbGxMZW5ndGggKyBvZmZzZXQpICYmICEodGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cpKSB7XG4gICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uID0gZGltZW5zaW9ucy5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uIC09IG9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uID0gTWF0aC5tYXgoMCwgc2Nyb2xsU3RhcnRQb3NpdGlvbik7XG5cbiAgICAgICAgY29uc3QgcGFnZUluZm8gPSB0aGlzLmNhbGN1bGF0ZVBhZ2VJbmZvKHNjcm9sbFN0YXJ0UG9zaXRpb24sIGRpbWVuc2lvbnMpO1xuICAgICAgICBjb25zdCBuZXdQYWRkaW5nID0gdGhpcy5jYWxjdWxhdGVQYWRkaW5nKHBhZ2VJbmZvLnN0YXJ0SW5kZXhXaXRoQnVmZmVyLCBkaW1lbnNpb25zKTtcbiAgICAgICAgY29uc3QgbmV3U2Nyb2xsTGVuZ3RoID0gZGltZW5zaW9ucy5zY3JvbGxMZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXJ0SW5kZXg6IHBhZ2VJbmZvLnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICBlbmRJbmRleDogcGFnZUluZm8uZW5kSW5kZXgsXG4gICAgICAgICAgICBzdGFydEluZGV4V2l0aEJ1ZmZlcjogcGFnZUluZm8uc3RhcnRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICBlbmRJbmRleFdpdGhCdWZmZXI6IHBhZ2VJbmZvLmVuZEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgIHBhZGRpbmc6IE1hdGgucm91bmQobmV3UGFkZGluZyksXG4gICAgICAgICAgICBzY3JvbGxMZW5ndGg6IE1hdGgucm91bmQobmV3U2Nyb2xsTGVuZ3RoKSxcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb246IHBhZ2VJbmZvLnNjcm9sbFN0YXJ0UG9zaXRpb24sXG4gICAgICAgICAgICBzY3JvbGxFbmRQb3NpdGlvbjogcGFnZUluZm8uc2Nyb2xsRW5kUG9zaXRpb24sXG4gICAgICAgICAgICBtYXhTY3JvbGxQb3NpdGlvbjogcGFnZUluZm8ubWF4U2Nyb2xsUG9zaXRpb25cbiAgICAgICAgfTtcbiAgICB9XG59XG5cbkBOZ01vZHVsZSh7XG4gICAgZXhwb3J0czogW1ZpcnR1YWxTY3JvbGxlckNvbXBvbmVudF0sXG4gICAgZGVjbGFyYXRpb25zOiBbVmlydHVhbFNjcm9sbGVyQ29tcG9uZW50XSxcbiAgICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcbiAgICBwcm92aWRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgcHJvdmlkZTogJ3ZpcnR1YWwtc2Nyb2xsZXItZGVmYXVsdC1vcHRpb25zJyxcbiAgICAgICAgICAgIHVzZUZhY3Rvcnk6IFZJUlRVQUxfU0NST0xMRVJfREVGQVVMVF9PUFRJT05TX0ZBQ1RPUllcbiAgICAgICAgfVxuICAgIF1cbn0pXG5leHBvcnQgY2xhc3MgVmlydHVhbFNjcm9sbGVyTW9kdWxlIHtcbn1cbiJdfQ==