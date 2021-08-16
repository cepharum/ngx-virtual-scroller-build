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
                    var oldStartItem_1 = oldViewPortItems_1[offset];
                    var oldStartItemIndex = _this_1.items.findIndex(function (x) { return _this_1.compareItems(oldStartItem_1, x); });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC12aXJ0dWFsLXNjcm9sbGVyLyIsInNvdXJjZXMiOlsidmlydHVhbC1zY3JvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUNILGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsWUFBWSxFQUFFLE9BQU8sRUFDckIsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxNQUFNLEVBQ04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsU0FBUyxHQUNaLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFakQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTdDLE9BQU8sS0FBSyxLQUFLLE1BQU0sbUJBQW1CLENBQUE7QUFjMUMsTUFBTSxVQUFVLHdDQUF3QztJQUNwRCxPQUFPO1FBQ0gsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixpQ0FBaUMsRUFBRSxJQUFJO1FBQ3ZDLDRCQUE0QixFQUFFLENBQUM7UUFDL0IsbUJBQW1CLEVBQUUsR0FBRztRQUN4QixrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLG9CQUFvQixFQUFFLENBQUM7UUFDdkIsWUFBWSxFQUFFLEtBQUs7S0FDdEIsQ0FBQztBQUNOLENBQUM7QUE4SEQ7SUEySEksa0NBQ3VCLE9BQW1CLEVBQ25CLFFBQW1CLEVBQ25CLElBQVksRUFDckIsaUJBQW9DO0lBQzlDLHFDQUFxQztJQUNoQixVQUFrQixFQUVuQyxPQUFzQztRQVB2QixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBQ25CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFDbkIsU0FBSSxHQUFKLElBQUksQ0FB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Q0M7U0FEWSxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIENoYW5nZURldGVjdG9yUmVmLFxuICAgIENvbXBvbmVudCxcbiAgICBDb250ZW50Q2hpbGQsIERvQ2hlY2ssXG4gICAgRWxlbWVudFJlZixcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgSW5qZWN0LFxuICAgIElucHV0LFxuICAgIE5nTW9kdWxlLFxuICAgIE5nWm9uZSxcbiAgICBPbkNoYW5nZXMsXG4gICAgT25EZXN0cm95LFxuICAgIE9uSW5pdCxcbiAgICBPcHRpb25hbCxcbiAgICBPdXRwdXQsXG4gICAgUmVuZGVyZXIyLFxuICAgIFZpZXdDaGlsZCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7UExBVEZPUk1fSUR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtpc1BsYXRmb3JtU2VydmVyfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5pbXBvcnQge0NvbW1vbk1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuaW1wb3J0ICogYXMgdHdlZW4gZnJvbSAnQHR3ZWVuanMvdHdlZW4uanMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlydHVhbFNjcm9sbGVyRGVmYXVsdE9wdGlvbnMge1xuICAgIGNoZWNrUmVzaXplSW50ZXJ2YWw6IG51bWJlclxuICAgIG1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbDogYm9vbGVhbixcbiAgICByZXNpemVCeXBhc3NSZWZyZXNoVGhyZXNob2xkOiBudW1iZXIsXG4gICAgc2Nyb2xsQW5pbWF0aW9uVGltZTogbnVtYmVyO1xuICAgIHNjcm9sbERlYm91bmNlVGltZTogbnVtYmVyO1xuICAgIHNjcm9sbFRocm90dGxpbmdUaW1lOiBudW1iZXI7XG4gICAgc2Nyb2xsYmFySGVpZ2h0PzogbnVtYmVyO1xuICAgIHNjcm9sbGJhcldpZHRoPzogbnVtYmVyO1xuICAgIHN0cmlwZWRUYWJsZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gVklSVFVBTF9TQ1JPTExFUl9ERUZBVUxUX09QVElPTlNfRkFDVE9SWSgpOiBWaXJ0dWFsU2Nyb2xsZXJEZWZhdWx0T3B0aW9ucyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2hlY2tSZXNpemVJbnRlcnZhbDogMTAwMCxcbiAgICAgICAgbW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsOiB0cnVlLFxuICAgICAgICByZXNpemVCeXBhc3NSZWZyZXNoVGhyZXNob2xkOiA1LFxuICAgICAgICBzY3JvbGxBbmltYXRpb25UaW1lOiA3NTAsXG4gICAgICAgIHNjcm9sbERlYm91bmNlVGltZTogMCxcbiAgICAgICAgc2Nyb2xsVGhyb3R0bGluZ1RpbWU6IDAsXG4gICAgICAgIHN0cmlwZWRUYWJsZTogZmFsc2VcbiAgICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdyYXBHcm91cERpbWVuc2lvbnMge1xuICAgIG1heENoaWxkU2l6ZVBlcldyYXBHcm91cDogV3JhcEdyb3VwRGltZW5zaW9uW107XG4gICAgbnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM6IG51bWJlcjtcbiAgICBzdW1PZktub3duV3JhcEdyb3VwQ2hpbGRIZWlnaHRzOiBudW1iZXI7XG4gICAgc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JhcEdyb3VwRGltZW5zaW9uIHtcbiAgICBjaGlsZEhlaWdodDogbnVtYmVyO1xuICAgIGNoaWxkV2lkdGg6IG51bWJlcjtcbiAgICBpdGVtczogYW55W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSURpbWVuc2lvbnMge1xuICAgIGNoaWxkSGVpZ2h0OiBudW1iZXI7XG4gICAgY2hpbGRXaWR0aDogbnVtYmVyO1xuICAgIGl0ZW1Db3VudDogbnVtYmVyO1xuICAgIGl0ZW1zUGVyUGFnZTogbnVtYmVyO1xuICAgIGl0ZW1zUGVyV3JhcEdyb3VwOiBudW1iZXI7XG4gICAgbWF4U2Nyb2xsUG9zaXRpb246IG51bWJlcjtcbiAgICBwYWdlQ291bnRfZnJhY3Rpb25hbDogbnVtYmVyO1xuICAgIHNjcm9sbExlbmd0aDogbnVtYmVyO1xuICAgIHZpZXdwb3J0TGVuZ3RoOiBudW1iZXI7XG4gICAgd3JhcEdyb3Vwc1BlclBhZ2U6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUGFnZUluZm8ge1xuICAgIGVuZEluZGV4OiBudW1iZXI7XG4gICAgZW5kSW5kZXhXaXRoQnVmZmVyOiBudW1iZXI7XG4gICAgbWF4U2Nyb2xsUG9zaXRpb246IG51bWJlcjtcbiAgICBzY3JvbGxFbmRQb3NpdGlvbjogbnVtYmVyO1xuICAgIHNjcm9sbFN0YXJ0UG9zaXRpb246IG51bWJlcjtcbiAgICBzdGFydEluZGV4OiBudW1iZXI7XG4gICAgc3RhcnRJbmRleFdpdGhCdWZmZXI6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJVmlld3BvcnQgZXh0ZW5kcyBJUGFnZUluZm8ge1xuICAgIHBhZGRpbmc6IG51bWJlcjtcbiAgICBzY3JvbGxMZW5ndGg6IG51bWJlcjtcbn1cblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICd2aXJ0dWFsLXNjcm9sbGVyLFt2aXJ0dWFsU2Nyb2xsZXJdJyxcbiAgICBleHBvcnRBczogJ3ZpcnR1YWxTY3JvbGxlcicsXG4gICAgdGVtcGxhdGU6IGBcbiAgICAgICAgPGRpdiBjbGFzcz1cInRvdGFsLXBhZGRpbmdcIiAjaW52aXNpYmxlUGFkZGluZz48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbGFibGUtY29udGVudFwiICNjb250ZW50PlxuICAgICAgICAgICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICAgICAgICA8L2Rpdj5cbiAgICBgLFxuICAgIGhvc3Q6IHtcbiAgICAgICAgJ1tjbGFzcy5ob3Jpem9udGFsXSc6ICdob3Jpem9udGFsJyxcbiAgICAgICAgJ1tjbGFzcy52ZXJ0aWNhbF0nOiAnIWhvcml6b250YWwnLFxuICAgICAgICAnW2NsYXNzLnNlbGZTY3JvbGxdJzogJyFwYXJlbnRTY3JvbGwnLFxuICAgICAgICAnW2NsYXNzLnJ0bF0nOiAnUlRMJ1xuICAgIH0sXG4gICAgc3R5bGVzOiBbYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0Lmhvcml6b250YWwuc2VsZlNjcm9sbCB7XG4gICAgICAgICAgICBvdmVyZmxvdy15OiB2aXNpYmxlO1xuICAgICAgICAgICAgb3ZlcmZsb3cteDogYXV0bztcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0Lmhvcml6b250YWwuc2VsZlNjcm9sbC5ydGwge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZVgoLTEpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QudmVydGljYWwuc2VsZlNjcm9sbCB7XG4gICAgICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICAgICAgb3ZlcmZsb3cteDogdmlzaWJsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zY3JvbGxhYmxlLWNvbnRlbnQge1xuICAgICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgICAgbGVmdDogMDtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgbWF4LXdpZHRoOiAxMDB2dztcbiAgICAgICAgICAgIG1heC1oZWlnaHQ6IDEwMHZoO1xuICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLnNjcm9sbGFibGUtY29udGVudCA6Om5nLWRlZXAgPiAqIHtcbiAgICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsIHtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsIC5zY3JvbGxhYmxlLWNvbnRlbnQge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0Lmhvcml6b250YWwgLnNjcm9sbGFibGUtY29udGVudCA6Om5nLWRlZXAgPiAqIHtcbiAgICAgICAgICAgIGZsZXgtc2hyaW5rOiAwO1xuICAgICAgICAgICAgZmxleC1ncm93OiAwO1xuICAgICAgICAgICAgd2hpdGUtc3BhY2U6IGluaXRpYWw7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsLnJ0bCAuc2Nyb2xsYWJsZS1jb250ZW50IDo6bmctZGVlcCA+ICoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZVgoLTEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRvdGFsLXBhZGRpbmcge1xuICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgICAgbGVmdDogMDtcbiAgICAgICAgICAgIGhlaWdodDogMXB4O1xuICAgICAgICAgICAgd2lkdGg6IDFweDtcbiAgICAgICAgICAgIHRyYW5zZm9ybS1vcmlnaW46IDAgMDtcbiAgICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdC5ob3Jpem9udGFsIC50b3RhbC1wYWRkaW5nIHtcbiAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgfVxuICAgIGBdXG59KVxuZXhwb3J0IGNsYXNzIFZpcnR1YWxTY3JvbGxlckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIERvQ2hlY2sge1xuXG4gICAgcHVibGljIGdldCB2aWV3UG9ydEluZm8oKTogSVBhZ2VJbmZvIHtcbiAgICAgICAgY29uc3QgcGFnZUluZm86IElWaWV3cG9ydCA9IHRoaXMucHJldmlvdXNWaWV3UG9ydCB8fCAoe30gYXMgYW55KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXJ0SW5kZXg6IHBhZ2VJbmZvLnN0YXJ0SW5kZXggfHwgMCxcbiAgICAgICAgICAgIGVuZEluZGV4OiBwYWdlSW5mby5lbmRJbmRleCB8fCAwLFxuICAgICAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbjogcGFnZUluZm8uc2Nyb2xsU3RhcnRQb3NpdGlvbiB8fCAwLFxuICAgICAgICAgICAgc2Nyb2xsRW5kUG9zaXRpb246IHBhZ2VJbmZvLnNjcm9sbEVuZFBvc2l0aW9uIHx8IDAsXG4gICAgICAgICAgICBtYXhTY3JvbGxQb3NpdGlvbjogcGFnZUluZm8ubWF4U2Nyb2xsUG9zaXRpb24gfHwgMCxcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyOiBwYWdlSW5mby5zdGFydEluZGV4V2l0aEJ1ZmZlciB8fCAwLFxuICAgICAgICAgICAgZW5kSW5kZXhXaXRoQnVmZmVyOiBwYWdlSW5mby5lbmRJbmRleFdpdGhCdWZmZXIgfHwgMFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBlbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXModmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuX2VuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgYnVmZmVyQW1vdW50KCk6IG51bWJlciB7XG4gICAgICAgIGlmICh0eXBlb2YgKHRoaXMuX2J1ZmZlckFtb3VudCkgPT09ICdudW1iZXInICYmIHRoaXMuX2J1ZmZlckFtb3VudCA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnVmZmVyQW1vdW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMgPyA1IDogMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgYnVmZmVyQW1vdW50KHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fYnVmZmVyQW1vdW50ID0gdmFsdWU7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IHNjcm9sbFRocm90dGxpbmdUaW1lKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY3JvbGxUaHJvdHRsaW5nVGltZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHNjcm9sbFRocm90dGxpbmdUaW1lKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsVGhyb3R0bGluZ1RpbWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy51cGRhdGVPblNjcm9sbEZ1bmN0aW9uKCk7XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgZ2V0IHNjcm9sbERlYm91bmNlVGltZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2Nyb2xsRGVib3VuY2VUaW1lO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgc2Nyb2xsRGVib3VuY2VUaW1lKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsRGVib3VuY2VUaW1lID0gdmFsdWU7XG4gICAgICAgIHRoaXMudXBkYXRlT25TY3JvbGxGdW5jdGlvbigpO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBjaGVja1Jlc2l6ZUludGVydmFsKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGVja1Jlc2l6ZUludGVydmFsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgY2hlY2tSZXNpemVJbnRlcnZhbCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1Jlc2l6ZUludGVydmFsID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbCA9IHZhbHVlO1xuICAgICAgICB0aGlzLmFkZFNjcm9sbEV2ZW50SGFuZGxlcnMoKTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgaXRlbXMoKTogYW55W10ge1xuICAgICAgICByZXR1cm4gdGhpcy5faXRlbXM7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBpdGVtcyh2YWx1ZTogYW55W10pIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0aGlzLl9pdGVtcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faXRlbXMgPSB2YWx1ZSB8fCBbXTtcbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKHRydWUpO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBob3Jpem9udGFsKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faG9yaXpvbnRhbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGhvcml6b250YWwodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5faG9yaXpvbnRhbCA9IHZhbHVlO1xuICAgICAgICB0aGlzLnVwZGF0ZURpcmVjdGlvbigpO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBwYXJlbnRTY3JvbGwoKTogRWxlbWVudCB8IFdpbmRvdyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRTY3JvbGw7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBwYXJlbnRTY3JvbGwodmFsdWU6IEVsZW1lbnQgfCBXaW5kb3cpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BhcmVudFNjcm9sbCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmV2ZXJ0UGFyZW50T3ZlcnNjcm9sbCgpO1xuICAgICAgICB0aGlzLl9wYXJlbnRTY3JvbGwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5hZGRTY3JvbGxFdmVudEhhbmRsZXJzKCk7XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuICAgICAgICBpZiAodGhpcy5tb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGwgJiYgc2Nyb2xsRWxlbWVudCAhPT0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMub2xkUGFyZW50U2Nyb2xsT3ZlcmZsb3cgPSB7eDogc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteCddLCB5OiBzY3JvbGxFbGVtZW50LnN0eWxlWydvdmVyZmxvdy15J119O1xuICAgICAgICAgICAgc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteSddID0gdGhpcy5ob3Jpem9udGFsID8gJ3Zpc2libGUnIDogJ2F1dG8nO1xuICAgICAgICAgICAgc2Nyb2xsRWxlbWVudC5zdHlsZVsnb3ZlcmZsb3cteCddID0gdGhpcy5ob3Jpem9udGFsID8gJ2F1dG8nIDogJ3Zpc2libGUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByb3RlY3RlZCByZWFkb25seSBlbGVtZW50OiBFbGVtZW50UmVmLFxuICAgICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IHpvbmU6IE5nWm9uZSxcbiAgICAgICAgcHJvdGVjdGVkIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmJhbi10eXBlc1xuICAgICAgICBASW5qZWN0KFBMQVRGT1JNX0lEKSBwbGF0Zm9ybUlkOiBPYmplY3QsXG4gICAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoJ3ZpcnR1YWwtc2Nyb2xsZXItZGVmYXVsdC1vcHRpb25zJylcbiAgICAgICAgICAgIG9wdGlvbnM6IFZpcnR1YWxTY3JvbGxlckRlZmF1bHRPcHRpb25zXG4gICAgKSB7XG5cbiAgICAgICAgdGhpcy5pc0FuZ3VsYXJVbml2ZXJzYWxTU1IgPSBpc1BsYXRmb3JtU2VydmVyKHBsYXRmb3JtSWQpO1xuXG4gICAgICAgIHRoaXMuY2hlY2tSZXNpemVJbnRlcnZhbCA9IG9wdGlvbnMuY2hlY2tSZXNpemVJbnRlcnZhbDtcbiAgICAgICAgdGhpcy5tb2RpZnlPdmVyZmxvd1N0eWxlT2ZQYXJlbnRTY3JvbGwgPSBvcHRpb25zLm1vZGlmeU92ZXJmbG93U3R5bGVPZlBhcmVudFNjcm9sbDtcbiAgICAgICAgdGhpcy5yZXNpemVCeXBhc3NSZWZyZXNoVGhyZXNob2xkID0gb3B0aW9ucy5yZXNpemVCeXBhc3NSZWZyZXNoVGhyZXNob2xkO1xuICAgICAgICB0aGlzLnNjcm9sbEFuaW1hdGlvblRpbWUgPSBvcHRpb25zLnNjcm9sbEFuaW1hdGlvblRpbWU7XG4gICAgICAgIHRoaXMuc2Nyb2xsRGVib3VuY2VUaW1lID0gb3B0aW9ucy5zY3JvbGxEZWJvdW5jZVRpbWU7XG4gICAgICAgIHRoaXMuc2Nyb2xsVGhyb3R0bGluZ1RpbWUgPSBvcHRpb25zLnNjcm9sbFRocm90dGxpbmdUaW1lO1xuICAgICAgICB0aGlzLnNjcm9sbGJhckhlaWdodCA9IG9wdGlvbnMuc2Nyb2xsYmFySGVpZ2h0O1xuICAgICAgICB0aGlzLnNjcm9sbGJhcldpZHRoID0gb3B0aW9ucy5zY3JvbGxiYXJXaWR0aDtcbiAgICAgICAgdGhpcy5zdHJpcGVkVGFibGUgPSBvcHRpb25zLnN0cmlwZWRUYWJsZTtcblxuICAgICAgICB0aGlzLmhvcml6b250YWwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXNldFdyYXBHcm91cERpbWVuc2lvbnMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdmlld1BvcnRJdGVtczogYW55W107XG4gICAgcHVibGljIHdpbmRvdyA9IHdpbmRvdztcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGV4ZWN1dGVSZWZyZXNoT3V0c2lkZUFuZ3VsYXJab25lID0gZmFsc2U7XG5cbiAgICBwcm90ZWN0ZWQgX2VuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzID0gZmFsc2U7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBSVEwgPSBmYWxzZTtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHVzZU1hcmdpbkluc3RlYWRPZlRyYW5zbGF0ZSA9IGZhbHNlO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgbW9kaWZ5T3ZlcmZsb3dTdHlsZU9mUGFyZW50U2Nyb2xsOiBib29sZWFuO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc3RyaXBlZFRhYmxlOiBib29sZWFuO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgc2Nyb2xsYmFyV2lkdGg6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNjcm9sbGJhckhlaWdodDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgY2hpbGRXaWR0aDogbnVtYmVyO1xuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgY2hpbGRIZWlnaHQ6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNzckNoaWxkV2lkdGg6IG51bWJlcjtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNzckNoaWxkSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzc3JWaWV3cG9ydFdpZHRoID0gMTkyMDtcblxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIHNzclZpZXdwb3J0SGVpZ2h0ID0gMTA4MDtcblxuICAgIHByb3RlY3RlZCBfYnVmZmVyQW1vdW50OiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBzY3JvbGxBbmltYXRpb25UaW1lOiBudW1iZXI7XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyByZXNpemVCeXBhc3NSZWZyZXNoVGhyZXNob2xkOiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgX3Njcm9sbFRocm90dGxpbmdUaW1lOiBudW1iZXI7XG5cbiAgICBwcm90ZWN0ZWQgX3Njcm9sbERlYm91bmNlVGltZTogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIG9uU2Nyb2xsOiAoKSA9PiB2b2lkO1xuXG4gICAgcHJvdGVjdGVkIGNoZWNrU2Nyb2xsRWxlbWVudFJlc2l6ZWRUaW1lcjogbnVtYmVyO1xuICAgIHByb3RlY3RlZCBfY2hlY2tSZXNpemVJbnRlcnZhbDogbnVtYmVyO1xuXG4gICAgcHJvdGVjdGVkIF9pdGVtczogYW55W10gPSBbXTtcblxuICAgIHByb3RlY3RlZCBfaG9yaXpvbnRhbDogYm9vbGVhbjtcblxuICAgIHByb3RlY3RlZCBvbGRQYXJlbnRTY3JvbGxPdmVyZmxvdzogeyB4OiBzdHJpbmcsIHk6IHN0cmluZyB9O1xuICAgIHByb3RlY3RlZCBfcGFyZW50U2Nyb2xsOiBFbGVtZW50IHwgV2luZG93O1xuXG4gICAgQE91dHB1dCgpXG4gICAgcHVibGljIHZzVXBkYXRlOiBFdmVudEVtaXR0ZXI8YW55W10+ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnlbXT4oKTtcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyB2c0NoYW5nZTogRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4gPSBuZXcgRXZlbnRFbWl0dGVyPElQYWdlSW5mbz4oKTtcblxuICAgIEBPdXRwdXQoKVxuICAgIHB1YmxpYyB2c1N0YXJ0OiBFdmVudEVtaXR0ZXI8SVBhZ2VJbmZvPiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBhZ2VJbmZvPigpO1xuXG4gICAgQE91dHB1dCgpXG4gICAgcHVibGljIHZzRW5kOiBFdmVudEVtaXR0ZXI8SVBhZ2VJbmZvPiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBhZ2VJbmZvPigpO1xuXG4gICAgQFZpZXdDaGlsZCgnY29udGVudCcsIHtyZWFkOiBFbGVtZW50UmVmLCBzdGF0aWM6IHRydWV9KVxuICAgIHByb3RlY3RlZCBjb250ZW50RWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAgIEBWaWV3Q2hpbGQoJ2ludmlzaWJsZVBhZGRpbmcnLCB7cmVhZDogRWxlbWVudFJlZiwgc3RhdGljOiB0cnVlfSlcbiAgICBwcm90ZWN0ZWQgaW52aXNpYmxlUGFkZGluZ0VsZW1lbnRSZWY6IEVsZW1lbnRSZWY7XG5cbiAgICBAQ29udGVudENoaWxkKCdoZWFkZXInLCB7cmVhZDogRWxlbWVudFJlZiwgc3RhdGljOiBmYWxzZX0pXG4gICAgcHJvdGVjdGVkIGhlYWRlckVsZW1lbnRSZWY6IEVsZW1lbnRSZWY7XG5cbiAgICBAQ29udGVudENoaWxkKCdjb250YWluZXInLCB7cmVhZDogRWxlbWVudFJlZiwgc3RhdGljOiBmYWxzZX0pXG4gICAgcHJvdGVjdGVkIGNvbnRhaW5lckVsZW1lbnRSZWY6IEVsZW1lbnRSZWY7XG5cbiAgICBwcm90ZWN0ZWQgaXNBbmd1bGFyVW5pdmVyc2FsU1NSOiBib29sZWFuO1xuXG4gICAgcHJvdGVjdGVkIHByZXZpb3VzU2Nyb2xsQm91bmRpbmdSZWN0OiBDbGllbnRSZWN0O1xuXG4gICAgcHJvdGVjdGVkIF9pbnZpc2libGVQYWRkaW5nUHJvcGVydHk7XG4gICAgcHJvdGVjdGVkIF9vZmZzZXRUeXBlO1xuICAgIHByb3RlY3RlZCBfc2Nyb2xsVHlwZTtcbiAgICBwcm90ZWN0ZWQgX3BhZ2VPZmZzZXRUeXBlO1xuICAgIHByb3RlY3RlZCBfY2hpbGRTY3JvbGxEaW07XG4gICAgcHJvdGVjdGVkIF90cmFuc2xhdGVEaXI7XG4gICAgcHJvdGVjdGVkIF9tYXJnaW5EaXI7XG5cbiAgICBwcm90ZWN0ZWQgY2FsY3VsYXRlZFNjcm9sbGJhcldpZHRoID0gMDtcbiAgICBwcm90ZWN0ZWQgY2FsY3VsYXRlZFNjcm9sbGJhckhlaWdodCA9IDA7XG5cbiAgICBwcm90ZWN0ZWQgcGFkZGluZyA9IDA7XG4gICAgcHJvdGVjdGVkIHByZXZpb3VzVmlld1BvcnQ6IElWaWV3cG9ydCA9IHt9IGFzIGFueTtcbiAgICBwcm90ZWN0ZWQgY3VycmVudFR3ZWVuOiB0d2Vlbi5Ud2VlbjtcbiAgICBwcm90ZWN0ZWQgY2FjaGVkSXRlbXNMZW5ndGg6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCBkaXNwb3NlU2Nyb2xsSGFuZGxlcjogKCkgPT4gdm9pZCB8IHVuZGVmaW5lZDtcbiAgICBwcm90ZWN0ZWQgZGlzcG9zZVJlc2l6ZUhhbmRsZXI6ICgpID0+IHZvaWQgfCB1bmRlZmluZWQ7XG5cbiAgICBwcm90ZWN0ZWQgbWluTWVhc3VyZWRDaGlsZFdpZHRoOiBudW1iZXI7XG4gICAgcHJvdGVjdGVkIG1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQ6IG51bWJlcjtcblxuICAgIHByb3RlY3RlZCB3cmFwR3JvdXBEaW1lbnNpb25zOiBXcmFwR3JvdXBEaW1lbnNpb25zO1xuXG4gICAgcHJvdGVjdGVkIGNhY2hlZFBhZ2VTaXplID0gMDtcbiAgICBwcm90ZWN0ZWQgcHJldmlvdXNTY3JvbGxOdW1iZXJFbGVtZW50cyA9IDA7XG5cbiAgICBwcm90ZWN0ZWQgdXBkYXRlT25TY3JvbGxGdW5jdGlvbigpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsRGVib3VuY2VUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLm9uU2Nyb2xsID0gKHRoaXMuZGVib3VuY2UoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgICAgICAgICB9LCB0aGlzLnNjcm9sbERlYm91bmNlVGltZSkgYXMgYW55KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNjcm9sbFRocm90dGxpbmdUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLm9uU2Nyb2xsID0gKHRoaXMudGhyb3R0bGVUcmFpbGluZygoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICAgICAgICAgIH0sIHRoaXMuc2Nyb2xsVGhyb3R0bGluZ1RpbWUpIGFzIGFueSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uU2Nyb2xsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQElucHV0KClcbiAgICBwdWJsaWMgY29tcGFyZUl0ZW1zOiAoaXRlbTE6IGFueSwgaXRlbTI6IGFueSkgPT4gYm9vbGVhbiA9IChpdGVtMTogYW55LCBpdGVtMjogYW55KSA9PiBpdGVtMSA9PT0gaXRlbTI7XG5cbiAgICBwcm90ZWN0ZWQgcmV2ZXJ0UGFyZW50T3ZlcnNjcm9sbCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuICAgICAgICBpZiAoc2Nyb2xsRWxlbWVudCAmJiB0aGlzLm9sZFBhcmVudFNjcm9sbE92ZXJmbG93KSB7XG4gICAgICAgICAgICBzY3JvbGxFbGVtZW50LnN0eWxlWydvdmVyZmxvdy15J10gPSB0aGlzLm9sZFBhcmVudFNjcm9sbE92ZXJmbG93Lnk7XG4gICAgICAgICAgICBzY3JvbGxFbGVtZW50LnN0eWxlWydvdmVyZmxvdy14J10gPSB0aGlzLm9sZFBhcmVudFNjcm9sbE92ZXJmbG93Lng7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9sZFBhcmVudFNjcm9sbE92ZXJmbG93ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hZGRTY3JvbGxFdmVudEhhbmRsZXJzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbEV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgdGhpcy5yZXZlcnRQYXJlbnRPdmVyc2Nyb2xsKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG5nT25DaGFuZ2VzKGNoYW5nZXM6IGFueSk6IHZvaWQge1xuICAgICAgICBjb25zdCBpbmRleExlbmd0aENoYW5nZWQgPSB0aGlzLmNhY2hlZEl0ZW1zTGVuZ3RoICE9PSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgdGhpcy5jYWNoZWRJdGVtc0xlbmd0aCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuXG4gICAgICAgIGNvbnN0IGZpcnN0UnVuOiBib29sZWFuID0gIWNoYW5nZXMuaXRlbXMgfHwgIWNoYW5nZXMuaXRlbXMucHJldmlvdXNWYWx1ZSB8fCBjaGFuZ2VzLml0ZW1zLnByZXZpb3VzVmFsdWUubGVuZ3RoID09PSAwO1xuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoaW5kZXhMZW5ndGhDaGFuZ2VkIHx8IGZpcnN0UnVuKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmdEb0NoZWNrKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jYWNoZWRJdGVtc0xlbmd0aCAhPT0gdGhpcy5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FjaGVkSXRlbXNMZW5ndGggPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbCh0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnByZXZpb3VzVmlld1BvcnQgJiYgdGhpcy52aWV3UG9ydEl0ZW1zICYmIHRoaXMudmlld1BvcnRJdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsZXQgaXRlbXNBcnJheUNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy52aWV3UG9ydEl0ZW1zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNvbXBhcmVJdGVtcyh0aGlzLml0ZW1zW3RoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlciArIGldLCB0aGlzLnZpZXdQb3J0SXRlbXNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zQXJyYXlDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW1zQXJyYXlDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlZnJlc2goKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbCh0cnVlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW52YWxpZGF0ZUFsbENhY2hlZE1lYXN1cmVtZW50cygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgbWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwOiBbXSxcbiAgICAgICAgICAgIG51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzOiAwLFxuICAgICAgICAgICAgc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzOiAwLFxuICAgICAgICAgICAgc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0czogMFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW52YWxpZGF0ZUNhY2hlZE1lYXN1cmVtZW50Rm9ySXRlbShpdGVtOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlVW5lcXVhbENoaWxkcmVuU2l6ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmluZGV4T2YoaXRlbSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUNhY2hlZE1lYXN1cmVtZW50QXRJbmRleChpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGludmFsaWRhdGVDYWNoZWRNZWFzdXJlbWVudEF0SW5kZXgoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgY29uc3QgY2FjaGVkTWVhc3VyZW1lbnQgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChjYWNoZWRNZWFzdXJlbWVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIC0tdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRXaWR0aHMgLT0gY2FjaGVkTWVhc3VyZW1lbnQuY2hpbGRXaWR0aCB8fCAwO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRIZWlnaHRzIC09IGNhY2hlZE1lYXN1cmVtZW50LmNoaWxkSGVpZ2h0IHx8IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNjcm9sbEludG8oaXRlbTogYW55LCBhbGlnblRvQmVnaW5uaW5nOiBib29sZWFuID0gdHJ1ZSwgYWRkaXRpb25hbE9mZnNldDogbnVtYmVyID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25NaWxsaXNlY29uZHM/OiBudW1iZXIsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBjb25zdCBpbmRleDogbnVtYmVyID0gdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNjcm9sbFRvSW5kZXgoaW5kZXgsIGFsaWduVG9CZWdpbm5pbmcsIGFkZGl0aW9uYWxPZmZzZXQsIGFuaW1hdGlvbk1pbGxpc2Vjb25kcywgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spO1xuICAgIH1cblxuICAgIHB1YmxpYyBzY3JvbGxUb0luZGV4KGluZGV4OiBudW1iZXIsIGFsaWduVG9CZWdpbm5pbmc6IGJvb2xlYW4gPSB0cnVlLCBhZGRpdGlvbmFsT2Zmc2V0OiBudW1iZXIgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbk1pbGxpc2Vjb25kcz86IG51bWJlciwgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2s/OiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIGxldCBtYXhSZXRyaWVzID0gNTtcblxuICAgICAgICBjb25zdCByZXRyeUlmTmVlZGVkID0gKCkgPT4ge1xuICAgICAgICAgICAgLS1tYXhSZXRyaWVzO1xuICAgICAgICAgICAgaWYgKG1heFJldHJpZXMgPD0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSB0aGlzLmNhbGN1bGF0ZURpbWVuc2lvbnMoKTtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTdGFydEluZGV4ID0gTWF0aC5taW4oTWF0aC5tYXgoaW5kZXgsIDApLCBkaW1lbnNpb25zLml0ZW1Db3VudCAtIDEpO1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4ID09PSBkZXNpcmVkU3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9JbmRleF9pbnRlcm5hbChpbmRleCwgYWxpZ25Ub0JlZ2lubmluZywgYWRkaXRpb25hbE9mZnNldCwgMCwgcmV0cnlJZk5lZWRlZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zY3JvbGxUb0luZGV4X2ludGVybmFsKGluZGV4LCBhbGlnblRvQmVnaW5uaW5nLCBhZGRpdGlvbmFsT2Zmc2V0LCBhbmltYXRpb25NaWxsaXNlY29uZHMsIHJldHJ5SWZOZWVkZWQpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBzY3JvbGxUb0luZGV4X2ludGVybmFsKGluZGV4OiBudW1iZXIsIGFsaWduVG9CZWdpbm5pbmc6IGJvb2xlYW4gPSB0cnVlLCBhZGRpdGlvbmFsT2Zmc2V0OiBudW1iZXIgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbk1pbGxpc2Vjb25kcz86IG51bWJlciwgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2s/OiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9IGFuaW1hdGlvbk1pbGxpc2Vjb25kcyA9PT0gdW5kZWZpbmVkID8gdGhpcy5zY3JvbGxBbmltYXRpb25UaW1lIDogYW5pbWF0aW9uTWlsbGlzZWNvbmRzO1xuXG4gICAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSB0aGlzLmNhbGN1bGF0ZURpbWVuc2lvbnMoKTtcbiAgICAgICAgbGV0IHNjcm9sbCA9IHRoaXMuY2FsY3VsYXRlUGFkZGluZyhpbmRleCwgZGltZW5zaW9ucykgKyBhZGRpdGlvbmFsT2Zmc2V0O1xuICAgICAgICBpZiAoIWFsaWduVG9CZWdpbm5pbmcpIHtcbiAgICAgICAgICAgIHNjcm9sbCAtPSBkaW1lbnNpb25zLndyYXBHcm91cHNQZXJQYWdlICogZGltZW5zaW9uc1t0aGlzLl9jaGlsZFNjcm9sbERpbV07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNjcm9sbFRvUG9zaXRpb24oc2Nyb2xsLCBhbmltYXRpb25NaWxsaXNlY29uZHMsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2Nyb2xsVG9Qb3NpdGlvbihzY3JvbGxQb3NpdGlvbjogbnVtYmVyLCBhbmltYXRpb25NaWxsaXNlY29uZHM/OiBudW1iZXIsIGFuaW1hdGlvbkNvbXBsZXRlZENhbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBzY3JvbGxQb3NpdGlvbiArPSB0aGlzLmdldEVsZW1lbnRzT2Zmc2V0KCk7XG5cbiAgICAgICAgYW5pbWF0aW9uTWlsbGlzZWNvbmRzID0gYW5pbWF0aW9uTWlsbGlzZWNvbmRzID09PSB1bmRlZmluZWQgPyB0aGlzLnNjcm9sbEFuaW1hdGlvblRpbWUgOiBhbmltYXRpb25NaWxsaXNlY29uZHM7XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudCA9IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpO1xuXG4gICAgICAgIGxldCBhbmltYXRpb25SZXF1ZXN0OiBudW1iZXI7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFR3ZWVuKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUd2Vlbi5zdG9wKCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUd2VlbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYW5pbWF0aW9uTWlsbGlzZWNvbmRzKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFByb3BlcnR5KHNjcm9sbEVsZW1lbnQsIHRoaXMuX3Njcm9sbFR5cGUsIHNjcm9sbFBvc2l0aW9uKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSwgYW5pbWF0aW9uQ29tcGxldGVkQ2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHdlZW5Db25maWdPYmogPSB7c2Nyb2xsUG9zaXRpb246IHNjcm9sbEVsZW1lbnRbdGhpcy5fc2Nyb2xsVHlwZV19O1xuXG4gICAgICAgIGNvbnN0IG5ld1R3ZWVuID0gbmV3IHR3ZWVuLlR3ZWVuKHR3ZWVuQ29uZmlnT2JqKVxuICAgICAgICAgICAgLnRvKHtzY3JvbGxQb3NpdGlvbn0sIGFuaW1hdGlvbk1pbGxpc2Vjb25kcylcbiAgICAgICAgICAgIC5lYXNpbmcodHdlZW4uRWFzaW5nLlF1YWRyYXRpYy5PdXQpXG4gICAgICAgICAgICAub25VcGRhdGUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4oZGF0YS5zY3JvbGxQb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFByb3BlcnR5KHNjcm9sbEVsZW1lbnQsIHRoaXMuX3Njcm9sbFR5cGUsIGRhdGEuc2Nyb2xsUG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcm5hbChmYWxzZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uU3RvcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbWF0aW9uUmVxdWVzdCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG5cbiAgICAgICAgY29uc3QgYW5pbWF0ZSA9ICh0aW1lPzogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoIW5ld1R3ZWVuLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXdUd2Vlbi51cGRhdGUodGltZSk7XG4gICAgICAgICAgICBpZiAodHdlZW5Db25maWdPYmouc2Nyb2xsUG9zaXRpb24gPT09IHNjcm9sbFBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlLCBhbmltYXRpb25Db21wbGV0ZWRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvblJlcXVlc3QgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBhbmltYXRlKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFR3ZWVuID0gbmV3VHdlZW47XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldEVsZW1lbnRTaXplKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogQ2xpZW50UmVjdCB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gICAgICAgIGNvbnN0IG1hcmdpblRvcCA9IHBhcnNlSW50KHN0eWxlc1snbWFyZ2luLXRvcCddLCAxMCkgfHwgMDtcbiAgICAgICAgY29uc3QgbWFyZ2luQm90dG9tID0gcGFyc2VJbnQoc3R5bGVzWydtYXJnaW4tYm90dG9tJ10sIDEwKSB8fCAwO1xuICAgICAgICBjb25zdCBtYXJnaW5MZWZ0ID0gcGFyc2VJbnQoc3R5bGVzWydtYXJnaW4tbGVmdCddLCAxMCkgfHwgMDtcbiAgICAgICAgY29uc3QgbWFyZ2luUmlnaHQgPSBwYXJzZUludChzdHlsZXNbJ21hcmdpbi1yaWdodCddLCAxMCkgfHwgMDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiByZXN1bHQudG9wICsgbWFyZ2luVG9wLFxuICAgICAgICAgICAgYm90dG9tOiByZXN1bHQuYm90dG9tICsgbWFyZ2luQm90dG9tLFxuICAgICAgICAgICAgbGVmdDogcmVzdWx0LmxlZnQgKyBtYXJnaW5MZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IHJlc3VsdC5yaWdodCArIG1hcmdpblJpZ2h0LFxuICAgICAgICAgICAgd2lkdGg6IHJlc3VsdC53aWR0aCArIG1hcmdpbkxlZnQgKyBtYXJnaW5SaWdodCxcbiAgICAgICAgICAgIGhlaWdodDogcmVzdWx0LmhlaWdodCArIG1hcmdpblRvcCArIG1hcmdpbkJvdHRvbVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBib3VuZGluZ1JlY3QgPSB0aGlzLmdldEVsZW1lbnRTaXplKHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpKTtcblxuICAgICAgICBsZXQgc2l6ZUNoYW5nZWQ6IGJvb2xlYW47XG4gICAgICAgIGlmICghdGhpcy5wcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdCkge1xuICAgICAgICAgICAgc2l6ZUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhDaGFuZ2UgPSBNYXRoLmFicyhib3VuZGluZ1JlY3Qud2lkdGggLSB0aGlzLnByZXZpb3VzU2Nyb2xsQm91bmRpbmdSZWN0LndpZHRoKTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodENoYW5nZSA9IE1hdGguYWJzKGJvdW5kaW5nUmVjdC5oZWlnaHQgLSB0aGlzLnByZXZpb3VzU2Nyb2xsQm91bmRpbmdSZWN0LmhlaWdodCk7XG4gICAgICAgICAgICBzaXplQ2hhbmdlZCA9IHdpZHRoQ2hhbmdlID4gdGhpcy5yZXNpemVCeXBhc3NSZWZyZXNoVGhyZXNob2xkIHx8IGhlaWdodENoYW5nZSA+IHRoaXMucmVzaXplQnlwYXNzUmVmcmVzaFRocmVzaG9sZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaXplQ2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c1Njcm9sbEJvdW5kaW5nUmVjdCA9IGJvdW5kaW5nUmVjdDtcbiAgICAgICAgICAgIGlmIChib3VuZGluZ1JlY3Qud2lkdGggPiAwICYmIGJvdW5kaW5nUmVjdC5oZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCB1cGRhdGVEaXJlY3Rpb24oKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmhvcml6b250YWwpIHtcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkU2Nyb2xsRGltID0gJ2NoaWxkV2lkdGgnO1xuICAgICAgICAgICAgdGhpcy5faW52aXNpYmxlUGFkZGluZ1Byb3BlcnR5ID0gJ3NjYWxlWCc7XG4gICAgICAgICAgICB0aGlzLl9tYXJnaW5EaXIgPSAnbWFyZ2luLWxlZnQnO1xuICAgICAgICAgICAgdGhpcy5fb2Zmc2V0VHlwZSA9ICdvZmZzZXRMZWZ0JztcbiAgICAgICAgICAgIHRoaXMuX3BhZ2VPZmZzZXRUeXBlID0gJ3BhZ2VYT2Zmc2V0JztcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbFR5cGUgPSAnc2Nyb2xsTGVmdCc7XG4gICAgICAgICAgICB0aGlzLl90cmFuc2xhdGVEaXIgPSAndHJhbnNsYXRlWCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jaGlsZFNjcm9sbERpbSA9ICdjaGlsZEhlaWdodCc7XG4gICAgICAgICAgICB0aGlzLl9pbnZpc2libGVQYWRkaW5nUHJvcGVydHkgPSAnc2NhbGVZJztcbiAgICAgICAgICAgIHRoaXMuX21hcmdpbkRpciA9ICdtYXJnaW4tdG9wJztcbiAgICAgICAgICAgIHRoaXMuX29mZnNldFR5cGUgPSAnb2Zmc2V0VG9wJztcbiAgICAgICAgICAgIHRoaXMuX3BhZ2VPZmZzZXRUeXBlID0gJ3BhZ2VZT2Zmc2V0JztcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbFR5cGUgPSAnc2Nyb2xsVG9wJztcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zbGF0ZURpciA9ICd0cmFuc2xhdGVZJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBkZWJvdW5jZShmdW5jOiAoKSA9PiBhbnksIHdhaXQ6IG51bWJlcik6ICgpID0+IGFueSB7XG4gICAgICAgIGNvbnN0IHRocm90dGxlZCA9IHRoaXMudGhyb3R0bGVUcmFpbGluZyhmdW5jLCB3YWl0KTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgKHRocm90dGxlZCBhcyBhbnkpLmNhbmNlbCgpO1xuICAgICAgICAgICAgdGhyb3R0bGVkLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJlc3VsdC5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAodGhyb3R0bGVkIGFzIGFueSkuY2FuY2VsKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdGhyb3R0bGVUcmFpbGluZyhmdW5jOiAoKSA9PiBhbnksIHdhaXQ6IG51bWJlcik6ICgpID0+IGFueSB7XG4gICAgICAgIGxldCB0aW1lb3V0O1xuICAgICAgICBsZXQgX2FyZ3VtZW50cyA9IGFyZ3VtZW50cztcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgX2FyZ3VtZW50cyA9IGFyZ3VtZW50c1xuXG4gICAgICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHdhaXQgPD0gMCkge1xuICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkoX3RoaXMsIF9hcmd1bWVudHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkoX3RoaXMsIF9hcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0sIHdhaXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXN1bHQuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgdGltZW91dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCByZWZyZXNoX2ludGVybmFsKGl0ZW1zQXJyYXlNb2RpZmllZDogYm9vbGVhbiwgcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrPzogKCkgPT4gdm9pZCwgbWF4UnVuVGltZXM6IG51bWJlciA9IDIpOiB2b2lkIHtcbiAgICAgICAgLy8gbm90ZTogbWF4UnVuVGltZXMgaXMgdG8gZm9yY2UgaXQgdG8ga2VlcCByZWNhbGN1bGF0aW5nIGlmIHRoZSBwcmV2aW91cyBpdGVyYXRpb24gY2F1c2VkIGEgcmUtcmVuZGVyXG4gICAgICAgIC8vICAgICAgIChkaWZmZXJlbnQgc2xpY2VkIGl0ZW1zIGluIHZpZXdwb3J0IG9yIHNjcm9sbFBvc2l0aW9uIGNoYW5nZWQpLlxuICAgICAgICAvLyBUaGUgZGVmYXVsdCBvZiAyeCBtYXggd2lsbCBwcm9iYWJseSBiZSBhY2N1cmF0ZSBlbm91Z2ggd2l0aG91dCBjYXVzaW5nIHRvbyBsYXJnZSBhIHBlcmZvcm1hbmNlIGJvdHRsZW5lY2tcbiAgICAgICAgLy8gVGhlIGNvZGUgd291bGQgdHlwaWNhbGx5IHF1aXQgb3V0IG9uIHRoZSAybmQgaXRlcmF0aW9uIGFueXdheXMuIFRoZSBtYWluIHRpbWUgaXQnZCB0aGluayBtb3JlIHRoYW4gMiBydW5zXG4gICAgICAgIC8vIHdvdWxkIGJlIG5lY2Vzc2FyeSB3b3VsZCBiZSBmb3IgdmFzdGx5IGRpZmZlcmVudCBzaXplZCBjaGlsZCBpdGVtcyBvciBpZiB0aGlzIGlzIHRoZSAxc3QgdGltZSB0aGUgaXRlbXMgYXJyYXlcbiAgICAgICAgLy8gd2FzIGluaXRpYWxpemVkLlxuICAgICAgICAvLyBXaXRob3V0IG1heFJ1blRpbWVzLCBJZiB0aGUgdXNlciBpcyBhY3RpdmVseSBzY3JvbGxpbmcgdGhpcyBjb2RlIHdvdWxkIGJlY29tZSBhbiBpbmZpbml0ZSBsb29wIHVudGlsIHRoZXlcbiAgICAgICAgLy8gc3RvcHBlZCBzY3JvbGxpbmcuIFRoaXMgd291bGQgYmUgb2theSwgZXhjZXB0IGVhY2ggc2Nyb2xsIGV2ZW50IHdvdWxkIHN0YXJ0IGFuIGFkZGl0aW9uYWwgaW5maW5pdGUgbG9vcC4gV2VcbiAgICAgICAgLy8gd2FudCB0byBzaG9ydC1jaXJjdWl0IGl0IHRvIHByZXZlbnQgdGhpcy5cblxuICAgICAgICBpZiAoaXRlbXNBcnJheU1vZGlmaWVkICYmIHRoaXMucHJldmlvdXNWaWV3UG9ydCAmJiB0aGlzLnByZXZpb3VzVmlld1BvcnQuc2Nyb2xsU3RhcnRQb3NpdGlvbiA+IDApIHtcbiAgICAgICAgICAgIC8vIGlmIGl0ZW1zIHdlcmUgcHJlcGVuZGVkLCBzY3JvbGwgZm9yd2FyZCB0byBrZWVwIHNhbWUgaXRlbXMgdmlzaWJsZVxuICAgICAgICAgICAgY29uc3Qgb2xkVmlld1BvcnQgPSB0aGlzLnByZXZpb3VzVmlld1BvcnQ7XG4gICAgICAgICAgICBjb25zdCBvbGRWaWV3UG9ydEl0ZW1zID0gdGhpcy52aWV3UG9ydEl0ZW1zO1xuXG5cdFx0XHRjb25zdCBvbGRSZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2sgPSByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2s7XG5cdFx0XHRyZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHNjcm9sbExlbmd0aERlbHRhID0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbExlbmd0aCAtIG9sZFZpZXdQb3J0LnNjcm9sbExlbmd0aDtcblx0XHRcdFx0aWYgKHNjcm9sbExlbmd0aERlbHRhID4gMCAmJiB0aGlzLnZpZXdQb3J0SXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXggLSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleFdpdGhCdWZmZXI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFN0YXJ0SXRlbSA9IG9sZFZpZXdQb3J0SXRlbXNbb2Zmc2V0XTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkU3RhcnRJdGVtSW5kZXggPSB0aGlzLml0ZW1zLmZpbmRJbmRleCh4ID0+IHRoaXMuY29tcGFyZUl0ZW1zKG9sZFN0YXJ0SXRlbSwgeCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRTdGFydEl0ZW1JbmRleCA+IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbU9yZGVyQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDEsIGwgPSB0aGlzLnZpZXdQb3J0SXRlbXMubGVuZ3RoIC0gb2Zmc2V0OyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNvbXBhcmVJdGVtcyh0aGlzLml0ZW1zW29sZFN0YXJ0SXRlbUluZGV4ICsgaV0sIG9sZFZpZXdQb3J0SXRlbXNbb2Zmc2V0ICsgaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1PcmRlckNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXRlbU9yZGVyQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Qb3NpdGlvbih0aGlzLnByZXZpb3VzVmlld1BvcnQuc2Nyb2xsU3RhcnRQb3NpdGlvbiArIHNjcm9sbExlbmd0aERlbHRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLCBvbGRSZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvbGRSZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkUmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zQXJyYXlNb2RpZmllZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2V0V3JhcEdyb3VwRGltZW5zaW9ucygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMuY2FsY3VsYXRlVmlld3BvcnQoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0Q2hhbmdlZCA9IGl0ZW1zQXJyYXlNb2RpZmllZCB8fCB2aWV3cG9ydC5zdGFydEluZGV4ICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc3RhcnRJbmRleDtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmRDaGFuZ2VkID0gaXRlbXNBcnJheU1vZGlmaWVkIHx8IHZpZXdwb3J0LmVuZEluZGV4ICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQuZW5kSW5kZXg7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsTGVuZ3RoQ2hhbmdlZCA9IHZpZXdwb3J0LnNjcm9sbExlbmd0aCAhPT0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgICAgICBjb25zdCBwYWRkaW5nQ2hhbmdlZCA9IHZpZXdwb3J0LnBhZGRpbmcgIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5wYWRkaW5nO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uQ2hhbmdlZCA9IHZpZXdwb3J0LnNjcm9sbFN0YXJ0UG9zaXRpb24gIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5zY3JvbGxTdGFydFBvc2l0aW9uIHx8XG4gICAgICAgICAgICAgICAgICAgIHZpZXdwb3J0LnNjcm9sbEVuZFBvc2l0aW9uICE9PSB0aGlzLnByZXZpb3VzVmlld1BvcnQuc2Nyb2xsRW5kUG9zaXRpb24gfHxcbiAgICAgICAgICAgICAgICAgICAgdmlld3BvcnQubWF4U2Nyb2xsUG9zaXRpb24gIT09IHRoaXMucHJldmlvdXNWaWV3UG9ydC5tYXhTY3JvbGxQb3NpdGlvbjtcblxuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNWaWV3UG9ydCA9IHZpZXdwb3J0O1xuXG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbExlbmd0aENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmludmlzaWJsZVBhZGRpbmdFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd0cmFuc2Zvcm0nLCBgJHt0aGlzLl9pbnZpc2libGVQYWRkaW5nUHJvcGVydHl9KCR7dmlld3BvcnQuc2Nyb2xsTGVuZ3RofSlgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmludmlzaWJsZVBhZGRpbmdFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd3ZWJraXRUcmFuc2Zvcm0nLCBgJHt0aGlzLl9pbnZpc2libGVQYWRkaW5nUHJvcGVydHl9KCR7dmlld3BvcnQuc2Nyb2xsTGVuZ3RofSlgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocGFkZGluZ0NoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudXNlTWFyZ2luSW5zdGVhZE9mVHJhbnNsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuY29udGVudEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgdGhpcy5fbWFyZ2luRGlyLCBgJHt2aWV3cG9ydC5wYWRkaW5nfXB4YCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuY29udGVudEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3RyYW5zZm9ybScsIGAke3RoaXMuX3RyYW5zbGF0ZURpcn0oJHt2aWV3cG9ydC5wYWRkaW5nfXB4KWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmNvbnRlbnRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd3ZWJraXRUcmFuc2Zvcm0nLCBgJHt0aGlzLl90cmFuc2xhdGVEaXJ9KCR7dmlld3BvcnQucGFkZGluZ31weClgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhlYWRlckVsZW1lbnRSZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLmdldFNjcm9sbEVsZW1lbnQoKVt0aGlzLl9zY3JvbGxUeXBlXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyT2Zmc2V0ID0gdGhpcy5nZXRFbGVtZW50c09mZnNldCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSBNYXRoLm1heChzY3JvbGxQb3NpdGlvbiAtIHZpZXdwb3J0LnBhZGRpbmcgLSBjb250YWluZXJPZmZzZXQgK1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFkZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpZW50SGVpZ2h0LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRTdHlsZSh0aGlzLmhlYWRlckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3RyYW5zZm9ybScsIGAke3RoaXMuX3RyYW5zbGF0ZURpcn0oJHtvZmZzZXR9cHgpYCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5oZWFkZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICd3ZWJraXRUcmFuc2Zvcm0nLCBgJHt0aGlzLl90cmFuc2xhdGVEaXJ9KCR7b2Zmc2V0fXB4KWApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZUV2ZW50QXJnOiBJUGFnZUluZm8gPSAoc3RhcnRDaGFuZ2VkIHx8IGVuZENoYW5nZWQpID8ge1xuICAgICAgICAgICAgICAgICAgICBzdGFydEluZGV4OiB2aWV3cG9ydC5zdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICBlbmRJbmRleDogdmlld3BvcnQuZW5kSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb246IHZpZXdwb3J0LnNjcm9sbFN0YXJ0UG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbEVuZFBvc2l0aW9uOiB2aWV3cG9ydC5zY3JvbGxFbmRQb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleFdpdGhCdWZmZXI6IHZpZXdwb3J0LnN0YXJ0SW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICBlbmRJbmRleFdpdGhCdWZmZXI6IHZpZXdwb3J0LmVuZEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgbWF4U2Nyb2xsUG9zaXRpb246IHZpZXdwb3J0Lm1heFNjcm9sbFBvc2l0aW9uXG4gICAgICAgICAgICAgICAgfSA6IHVuZGVmaW5lZDtcblxuXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0Q2hhbmdlZCB8fCBlbmRDaGFuZ2VkIHx8IHNjcm9sbFBvc2l0aW9uQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzY3JvbGwgbGlzdCB0byB0cmlnZ2VyIHJlLXJlbmRlciBvZiBjb21wb25lbnRzIGluIHZpZXdwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdQb3J0SXRlbXMgPSB2aWV3cG9ydC5zdGFydEluZGV4V2l0aEJ1ZmZlciA+PSAwICYmIHZpZXdwb3J0LmVuZEluZGV4V2l0aEJ1ZmZlciA+PSAwID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnNsaWNlKHZpZXdwb3J0LnN0YXJ0SW5kZXhXaXRoQnVmZmVyLCB2aWV3cG9ydC5lbmRJbmRleFdpdGhCdWZmZXIgKyAxKSA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52c1VwZGF0ZS5lbWl0KHRoaXMudmlld1BvcnRJdGVtcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZzU3RhcnQuZW1pdChjaGFuZ2VFdmVudEFyZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52c0VuZC5lbWl0KGNoYW5nZUV2ZW50QXJnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0Q2hhbmdlZCB8fCBlbmRDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZzQ2hhbmdlLmVtaXQoY2hhbmdlRXZlbnRBcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4UnVuVGltZXMgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVybmFsKGZhbHNlLCByZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2ssIG1heFJ1blRpbWVzIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaENvbXBsZXRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5leGVjdXRlUmVmcmVzaE91dHNpZGVBbmd1bGFyWm9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ2hhbmdlZCgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56b25lLnJ1bihoYW5kbGVDaGFuZ2VkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXhSdW5UaW1lcyA+IDAgJiYgKHNjcm9sbExlbmd0aENoYW5nZWQgfHwgcGFkZGluZ0NoYW5nZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJuYWwoZmFsc2UsIHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaywgbWF4UnVuVGltZXMgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWZyZXNoQ29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hDb21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRTY3JvbGxFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50U2Nyb2xsIGluc3RhbmNlb2YgV2luZG93ID8gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHxcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkgOiB0aGlzLnBhcmVudFNjcm9sbCB8fCB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYWRkU2Nyb2xsRXZlbnRIYW5kbGVycygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmd1bGFyVW5pdmVyc2FsU1NSKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JvbGxFbGVtZW50ID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KCk7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxFdmVudEhhbmRsZXJzKCk7XG5cbiAgICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudFNjcm9sbCBpbnN0YW5jZW9mIFdpbmRvdykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVNjcm9sbEhhbmRsZXIgPSB0aGlzLnJlbmRlcmVyLmxpc3Rlbignd2luZG93JywgJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVJlc2l6ZUhhbmRsZXIgPSB0aGlzLnJlbmRlcmVyLmxpc3Rlbignd2luZG93JywgJ3Jlc2l6ZScsIHRoaXMub25TY3JvbGwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTY3JvbGxIYW5kbGVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oc2Nyb2xsRWxlbWVudCwgJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jaGVja1Jlc2l6ZUludGVydmFsID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrU2Nyb2xsRWxlbWVudFJlc2l6ZWRUaW1lciA9IChzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrU2Nyb2xsRWxlbWVudFJlc2l6ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcy5fY2hlY2tSZXNpemVJbnRlcnZhbCkgYXMgYW55KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCByZW1vdmVTY3JvbGxFdmVudEhhbmRsZXJzKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5jaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkVGltZXIpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5jaGVja1Njcm9sbEVsZW1lbnRSZXNpemVkVGltZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zZVNjcm9sbEhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZVNjcm9sbEhhbmRsZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZVNjcm9sbEhhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kaXNwb3NlUmVzaXplSGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlUmVzaXplSGFuZGxlcigpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlUmVzaXplSGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRFbGVtZW50c09mZnNldCgpOiBudW1iZXIge1xuICAgICAgICBpZiAodGhpcy5pc0FuZ3VsYXJVbml2ZXJzYWxTU1IpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XG5cbiAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyRWxlbWVudFJlZiAmJiB0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY29udGFpbmVyRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50W3RoaXMuX29mZnNldFR5cGVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucGFyZW50U2Nyb2xsKSB7XG4gICAgICAgICAgICBjb25zdCBzY3JvbGxFbGVtZW50ID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50Q2xpZW50UmVjdCA9IHRoaXMuZ2V0RWxlbWVudFNpemUodGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQpO1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsQ2xpZW50UmVjdCA9IHRoaXMuZ2V0RWxlbWVudFNpemUoc2Nyb2xsRWxlbWVudCk7XG4gICAgICAgICAgICBpZiAodGhpcy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGVsZW1lbnRDbGllbnRSZWN0LmxlZnQgLSBzY3JvbGxDbGllbnRSZWN0LmxlZnQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBlbGVtZW50Q2xpZW50UmVjdC50b3AgLSBzY3JvbGxDbGllbnRSZWN0LnRvcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCEodGhpcy5wYXJlbnRTY3JvbGwgaW5zdGFuY2VvZiBXaW5kb3cpKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHNjcm9sbEVsZW1lbnRbdGhpcy5fc2Nyb2xsVHlwZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2Zmc2V0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjb3VudEl0ZW1zUGVyV3JhcEdyb3VwKCk6IG51bWJlciB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5ndWxhclVuaXZlcnNhbFNTUikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5ob3Jpem9udGFsID8gdGhpcy5zc3JWaWV3cG9ydEhlaWdodCAvIHRoaXMuc3NyQ2hpbGRIZWlnaHQgOiB0aGlzLnNzclZpZXdwb3J0V2lkdGggLyB0aGlzLnNzckNoaWxkV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gdGhpcy5ob3Jpem9udGFsID8gJ29mZnNldExlZnQnIDogJ29mZnNldFRvcCc7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gKCh0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYgJiYgdGhpcy5jb250YWluZXJFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpIHx8XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpLmNoaWxkcmVuO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuTGVuZ3RoID0gY2hpbGRyZW4gPyBjaGlsZHJlbi5sZW5ndGggOiAwO1xuICAgICAgICBpZiAoY2hpbGRyZW5MZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlyc3RPZmZzZXQgPSBjaGlsZHJlblswXVtwcm9wZXJ0eU5hbWVdO1xuICAgICAgICBsZXQgcmVzdWx0ID0gMTtcbiAgICAgICAgd2hpbGUgKHJlc3VsdCA8IGNoaWxkcmVuTGVuZ3RoICYmIGZpcnN0T2Zmc2V0ID09PSBjaGlsZHJlbltyZXN1bHRdW3Byb3BlcnR5TmFtZV0pIHtcbiAgICAgICAgICAgICsrcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0U2Nyb2xsU3RhcnRQb3NpdGlvbigpOiBudW1iZXIge1xuICAgICAgICBsZXQgd2luZG93U2Nyb2xsVmFsdWU7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudFNjcm9sbCBpbnN0YW5jZW9mIFdpbmRvdykge1xuICAgICAgICAgICAgd2luZG93U2Nyb2xsVmFsdWUgPSB3aW5kb3dbdGhpcy5fcGFnZU9mZnNldFR5cGVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdpbmRvd1Njcm9sbFZhbHVlIHx8IHRoaXMuZ2V0U2Nyb2xsRWxlbWVudCgpW3RoaXMuX3Njcm9sbFR5cGVdIHx8IDA7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHJlc2V0V3JhcEdyb3VwRGltZW5zaW9ucygpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgb2xkV3JhcEdyb3VwRGltZW5zaW9ucyA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucztcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlQWxsQ2FjaGVkTWVhc3VyZW1lbnRzKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzIHx8ICFvbGRXcmFwR3JvdXBEaW1lbnNpb25zIHx8IG9sZFdyYXBHcm91cERpbWVuc2lvbnMubnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXMgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGl0ZW1zUGVyV3JhcEdyb3VwOiBudW1iZXIgPSB0aGlzLmNvdW50SXRlbXNQZXJXcmFwR3JvdXAoKTtcbiAgICAgICAgZm9yIChsZXQgd3JhcEdyb3VwSW5kZXggPSAwOyB3cmFwR3JvdXBJbmRleCA8IG9sZFdyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwLmxlbmd0aDsgKyt3cmFwR3JvdXBJbmRleCkge1xuICAgICAgICAgICAgY29uc3Qgb2xkV3JhcEdyb3VwRGltZW5zaW9uOiBXcmFwR3JvdXBEaW1lbnNpb24gPSBvbGRXcmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFt3cmFwR3JvdXBJbmRleF07XG4gICAgICAgICAgICBpZiAoIW9sZFdyYXBHcm91cERpbWVuc2lvbiB8fCAhb2xkV3JhcEdyb3VwRGltZW5zaW9uLml0ZW1zIHx8ICFvbGRXcmFwR3JvdXBEaW1lbnNpb24uaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvbGRXcmFwR3JvdXBEaW1lbnNpb24uaXRlbXMubGVuZ3RoICE9PSBpdGVtc1BlcldyYXBHcm91cCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGl0ZW1zQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgYXJyYXlTdGFydEluZGV4ID0gaXRlbXNQZXJXcmFwR3JvdXAgKiB3cmFwR3JvdXBJbmRleDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXNQZXJXcmFwR3JvdXA7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jb21wYXJlSXRlbXMob2xkV3JhcEdyb3VwRGltZW5zaW9uLml0ZW1zW2ldLCB0aGlzLml0ZW1zW2FycmF5U3RhcnRJbmRleCArIGldKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXRlbXNDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgKyt0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM7XG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRocyArPSBvbGRXcmFwR3JvdXBEaW1lbnNpb24uY2hpbGRXaWR0aCB8fCAwO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5zdW1PZktub3duV3JhcEdyb3VwQ2hpbGRIZWlnaHRzICs9IG9sZFdyYXBHcm91cERpbWVuc2lvbi5jaGlsZEhlaWdodCB8fCAwO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbd3JhcEdyb3VwSW5kZXhdID0gb2xkV3JhcEdyb3VwRGltZW5zaW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZURpbWVuc2lvbnMoKTogSURpbWVuc2lvbnMge1xuICAgICAgICBjb25zdCBzY3JvbGxFbGVtZW50ID0gdGhpcy5nZXRTY3JvbGxFbGVtZW50KCk7XG5cbiAgICAgICAgY29uc3QgbWF4Q2FsY3VsYXRlZFNjcm9sbEJhclNpemUgPSAyNTsgLy8gTm90ZTogRm9ybXVsYSB0byBhdXRvLWNhbGN1bGF0ZSBkb2Vzbid0IHdvcmsgZm9yIFBhcmVudFNjcm9sbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgc28gd2UgZGVmYXVsdCB0byB0aGlzIGlmIG5vdCBzZXQgYnkgY29uc3VtaW5nIGFwcGxpY2F0aW9uXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlZFNjcm9sbGJhckhlaWdodCA9IE1hdGgubWF4KE1hdGgubWluKHNjcm9sbEVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICBtYXhDYWxjdWxhdGVkU2Nyb2xsQmFyU2l6ZSksIHRoaXMuY2FsY3VsYXRlZFNjcm9sbGJhckhlaWdodCk7XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlZFNjcm9sbGJhcldpZHRoID0gTWF0aC5tYXgoTWF0aC5taW4oc2Nyb2xsRWxlbWVudC5vZmZzZXRXaWR0aCAtIHNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBtYXhDYWxjdWxhdGVkU2Nyb2xsQmFyU2l6ZSksIHRoaXMuY2FsY3VsYXRlZFNjcm9sbGJhcldpZHRoKTtcblxuICAgICAgICBsZXQgdmlld3BvcnRXaWR0aCA9IHNjcm9sbEVsZW1lbnQub2Zmc2V0V2lkdGggLSAodGhpcy5zY3JvbGxiYXJXaWR0aCB8fCB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJXaWR0aCB8fFxuICAgICAgICAgICAgKHRoaXMuaG9yaXpvbnRhbCA/IDAgOiBtYXhDYWxjdWxhdGVkU2Nyb2xsQmFyU2l6ZSkpO1xuICAgICAgICBsZXQgdmlld3BvcnRIZWlnaHQgPSBzY3JvbGxFbGVtZW50Lm9mZnNldEhlaWdodCAtICh0aGlzLnNjcm9sbGJhckhlaWdodCB8fCB0aGlzLmNhbGN1bGF0ZWRTY3JvbGxiYXJIZWlnaHQgfHxcbiAgICAgICAgICAgICh0aGlzLmhvcml6b250YWwgPyBtYXhDYWxjdWxhdGVkU2Nyb2xsQmFyU2l6ZSA6IDApKTtcblxuICAgICAgICBjb25zdCBjb250ZW50ID0gKHRoaXMuY29udGFpbmVyRWxlbWVudFJlZiAmJiB0aGlzLmNvbnRhaW5lckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCkgfHwgdGhpcy5jb250ZW50RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuXG4gICAgICAgIGNvbnN0IGl0ZW1zUGVyV3JhcEdyb3VwID0gdGhpcy5jb3VudEl0ZW1zUGVyV3JhcEdyb3VwKCk7XG4gICAgICAgIGxldCB3cmFwR3JvdXBzUGVyUGFnZTtcblxuICAgICAgICBsZXQgZGVmYXVsdENoaWxkV2lkdGg7XG4gICAgICAgIGxldCBkZWZhdWx0Q2hpbGRIZWlnaHQ7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNBbmd1bGFyVW5pdmVyc2FsU1NSKSB7XG4gICAgICAgICAgICB2aWV3cG9ydFdpZHRoID0gdGhpcy5zc3JWaWV3cG9ydFdpZHRoO1xuICAgICAgICAgICAgdmlld3BvcnRIZWlnaHQgPSB0aGlzLnNzclZpZXdwb3J0SGVpZ2h0O1xuICAgICAgICAgICAgZGVmYXVsdENoaWxkV2lkdGggPSB0aGlzLnNzckNoaWxkV2lkdGg7XG4gICAgICAgICAgICBkZWZhdWx0Q2hpbGRIZWlnaHQgPSB0aGlzLnNzckNoaWxkSGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgaXRlbXNQZXJSb3cgPSBNYXRoLm1heChNYXRoLmNlaWwodmlld3BvcnRXaWR0aCAvIGRlZmF1bHRDaGlsZFdpZHRoKSwgMSk7XG4gICAgICAgICAgICBjb25zdCBpdGVtc1BlckNvbCA9IE1hdGgubWF4KE1hdGguY2VpbCh2aWV3cG9ydEhlaWdodCAvIGRlZmF1bHRDaGlsZEhlaWdodCksIDEpO1xuICAgICAgICAgICAgd3JhcEdyb3Vwc1BlclBhZ2UgPSB0aGlzLmhvcml6b250YWwgPyBpdGVtc1BlclJvdyA6IGl0ZW1zUGVyQ29sO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKSB7XG4gICAgICAgICAgICBpZiAoY29udGVudC5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNoaWxkV2lkdGggfHwgIXRoaXMuY2hpbGRIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCAmJiB2aWV3cG9ydFdpZHRoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGggPSB2aWV3cG9ydFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ICYmIHZpZXdwb3J0SGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5NZWFzdXJlZENoaWxkSGVpZ2h0ID0gdmlld3BvcnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IGNvbnRlbnQuY2hpbGRyZW5bMF07XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHRoaXMuZ2V0RWxlbWVudFNpemUoY2hpbGQpO1xuICAgICAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZFdpZHRoID0gTWF0aC5taW4odGhpcy5taW5NZWFzdXJlZENoaWxkV2lkdGgsIGNsaWVudFJlY3Qud2lkdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCA9IE1hdGgubWluKHRoaXMubWluTWVhc3VyZWRDaGlsZEhlaWdodCwgY2xpZW50UmVjdC5oZWlnaHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWZhdWx0Q2hpbGRXaWR0aCA9IHRoaXMuY2hpbGRXaWR0aCB8fCB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRXaWR0aCB8fCB2aWV3cG9ydFdpZHRoO1xuICAgICAgICAgICAgZGVmYXVsdENoaWxkSGVpZ2h0ID0gdGhpcy5jaGlsZEhlaWdodCB8fCB0aGlzLm1pbk1lYXN1cmVkQ2hpbGRIZWlnaHQgfHwgdmlld3BvcnRIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBpdGVtc1BlclJvdyA9IE1hdGgubWF4KE1hdGguY2VpbCh2aWV3cG9ydFdpZHRoIC8gZGVmYXVsdENoaWxkV2lkdGgpLCAxKTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zUGVyQ29sID0gTWF0aC5tYXgoTWF0aC5jZWlsKHZpZXdwb3J0SGVpZ2h0IC8gZGVmYXVsdENoaWxkSGVpZ2h0KSwgMSk7XG4gICAgICAgICAgICB3cmFwR3JvdXBzUGVyUGFnZSA9IHRoaXMuaG9yaXpvbnRhbCA/IGl0ZW1zUGVyUm93IDogaXRlbXNQZXJDb2w7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsRWxlbWVudFt0aGlzLl9zY3JvbGxUeXBlXSAtICh0aGlzLnByZXZpb3VzVmlld1BvcnQgPyB0aGlzLnByZXZpb3VzVmlld1BvcnQucGFkZGluZyA6IDApO1xuXG4gICAgICAgICAgICBsZXQgYXJyYXlTdGFydEluZGV4ID0gdGhpcy5wcmV2aW91c1ZpZXdQb3J0LnN0YXJ0SW5kZXhXaXRoQnVmZmVyIHx8IDA7XG4gICAgICAgICAgICBsZXQgd3JhcEdyb3VwSW5kZXggPSBNYXRoLmNlaWwoYXJyYXlTdGFydEluZGV4IC8gaXRlbXNQZXJXcmFwR3JvdXApO1xuXG4gICAgICAgICAgICBsZXQgbWF4V2lkdGhGb3JXcmFwR3JvdXAgPSAwO1xuICAgICAgICAgICAgbGV0IG1heEhlaWdodEZvcldyYXBHcm91cCA9IDA7XG4gICAgICAgICAgICBsZXQgc3VtT2ZWaXNpYmxlTWF4V2lkdGhzID0gMDtcbiAgICAgICAgICAgIGxldCBzdW1PZlZpc2libGVNYXhIZWlnaHRzID0gMDtcbiAgICAgICAgICAgIHdyYXBHcm91cHNQZXJQYWdlID0gMDtcblxuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnByZWZlci1mb3Itb2ZcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGVudC5jaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICsrYXJyYXlTdGFydEluZGV4O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY29udGVudC5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGllbnRSZWN0ID0gdGhpcy5nZXRFbGVtZW50U2l6ZShjaGlsZCk7XG5cbiAgICAgICAgICAgICAgICBtYXhXaWR0aEZvcldyYXBHcm91cCA9IE1hdGgubWF4KG1heFdpZHRoRm9yV3JhcEdyb3VwLCBjbGllbnRSZWN0LndpZHRoKTtcbiAgICAgICAgICAgICAgICBtYXhIZWlnaHRGb3JXcmFwR3JvdXAgPSBNYXRoLm1heChtYXhIZWlnaHRGb3JXcmFwR3JvdXAsIGNsaWVudFJlY3QuaGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgIGlmIChhcnJheVN0YXJ0SW5kZXggJSBpdGVtc1BlcldyYXBHcm91cCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbd3JhcEdyb3VwSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC0tdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLnN1bU9mS25vd25XcmFwR3JvdXBDaGlsZFdpZHRocyAtPSBvbGRWYWx1ZS5jaGlsZFdpZHRoIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0cyAtPSBvbGRWYWx1ZS5jaGlsZEhlaWdodCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgKyt0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5pdGVtcy5zbGljZShhcnJheVN0YXJ0SW5kZXggLSBpdGVtc1BlcldyYXBHcm91cCwgYXJyYXlTdGFydEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFt3cmFwR3JvdXBJbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFdpZHRoOiBtYXhXaWR0aEZvcldyYXBHcm91cCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkSGVpZ2h0OiBtYXhIZWlnaHRGb3JXcmFwR3JvdXAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtc1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzICs9IG1heFdpZHRoRm9yV3JhcEdyb3VwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0cyArPSBtYXhIZWlnaHRGb3JXcmFwR3JvdXA7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1heFZpc2libGVXaWR0aEZvcldyYXBHcm91cCA9IE1hdGgubWluKG1heFdpZHRoRm9yV3JhcEdyb3VwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KHZpZXdwb3J0V2lkdGggLSBzdW1PZlZpc2libGVNYXhXaWR0aHMsIDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsT2Zmc2V0VG9SZW1vdmUgPSBNYXRoLm1pbihzY3JvbGxPZmZzZXQsIG1heFZpc2libGVXaWR0aEZvcldyYXBHcm91cCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4VmlzaWJsZVdpZHRoRm9yV3JhcEdyb3VwIC09IHNjcm9sbE9mZnNldFRvUmVtb3ZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbE9mZnNldCAtPSBzY3JvbGxPZmZzZXRUb1JlbW92ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgc3VtT2ZWaXNpYmxlTWF4V2lkdGhzICs9IG1heFZpc2libGVXaWR0aEZvcldyYXBHcm91cDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXhWaXNpYmxlV2lkdGhGb3JXcmFwR3JvdXAgPiAwICYmIHZpZXdwb3J0V2lkdGggPj0gc3VtT2ZWaXNpYmxlTWF4V2lkdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyt3cmFwR3JvdXBzUGVyUGFnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXhWaXNpYmxlSGVpZ2h0Rm9yV3JhcEdyb3VwID0gTWF0aC5taW4obWF4SGVpZ2h0Rm9yV3JhcEdyb3VwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KHZpZXdwb3J0SGVpZ2h0IC0gc3VtT2ZWaXNpYmxlTWF4SGVpZ2h0cywgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjcm9sbE9mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JvbGxPZmZzZXRUb1JlbW92ZSA9IE1hdGgubWluKHNjcm9sbE9mZnNldCwgbWF4VmlzaWJsZUhlaWdodEZvcldyYXBHcm91cCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4VmlzaWJsZUhlaWdodEZvcldyYXBHcm91cCAtPSBzY3JvbGxPZmZzZXRUb1JlbW92ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQgLT0gc2Nyb2xsT2Zmc2V0VG9SZW1vdmU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bU9mVmlzaWJsZU1heEhlaWdodHMgKz0gbWF4VmlzaWJsZUhlaWdodEZvcldyYXBHcm91cDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXhWaXNpYmxlSGVpZ2h0Rm9yV3JhcEdyb3VwID4gMCAmJiB2aWV3cG9ydEhlaWdodCA+PSBzdW1PZlZpc2libGVNYXhIZWlnaHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyt3cmFwR3JvdXBzUGVyUGFnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICsrd3JhcEdyb3VwSW5kZXg7XG5cbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGhGb3JXcmFwR3JvdXAgPSAwO1xuICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHRGb3JXcmFwR3JvdXAgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYXZlcmFnZUNoaWxkV2lkdGggPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkV2lkdGhzIC9cbiAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubnVtYmVyT2ZLbm93bldyYXBHcm91cENoaWxkU2l6ZXM7XG4gICAgICAgICAgICBjb25zdCBhdmVyYWdlQ2hpbGRIZWlnaHQgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMuc3VtT2ZLbm93bldyYXBHcm91cENoaWxkSGVpZ2h0cyAvXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm51bWJlck9mS25vd25XcmFwR3JvdXBDaGlsZFNpemVzO1xuICAgICAgICAgICAgZGVmYXVsdENoaWxkV2lkdGggPSB0aGlzLmNoaWxkV2lkdGggfHwgYXZlcmFnZUNoaWxkV2lkdGggfHwgdmlld3BvcnRXaWR0aDtcbiAgICAgICAgICAgIGRlZmF1bHRDaGlsZEhlaWdodCA9IHRoaXMuY2hpbGRIZWlnaHQgfHwgYXZlcmFnZUNoaWxkSGVpZ2h0IHx8IHZpZXdwb3J0SGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZpZXdwb3J0V2lkdGggPiBzdW1PZlZpc2libGVNYXhXaWR0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgd3JhcEdyb3Vwc1BlclBhZ2UgKz0gTWF0aC5jZWlsKCh2aWV3cG9ydFdpZHRoIC0gc3VtT2ZWaXNpYmxlTWF4V2lkdGhzKSAvIGRlZmF1bHRDaGlsZFdpZHRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh2aWV3cG9ydEhlaWdodCA+IHN1bU9mVmlzaWJsZU1heEhlaWdodHMpIHtcbiAgICAgICAgICAgICAgICAgICAgd3JhcEdyb3Vwc1BlclBhZ2UgKz0gTWF0aC5jZWlsKCh2aWV3cG9ydEhlaWdodCAtIHN1bU9mVmlzaWJsZU1heEhlaWdodHMpIC8gZGVmYXVsdENoaWxkSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtQ291bnQgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgY29uc3QgaXRlbXNQZXJQYWdlID0gaXRlbXNQZXJXcmFwR3JvdXAgKiB3cmFwR3JvdXBzUGVyUGFnZTtcbiAgICAgICAgY29uc3QgcGFnZUNvdW50RnJhY3Rpb25hbCA9IGl0ZW1Db3VudCAvIGl0ZW1zUGVyUGFnZTtcbiAgICAgICAgY29uc3QgbnVtYmVyT2ZXcmFwR3JvdXBzID0gTWF0aC5jZWlsKGl0ZW1Db3VudCAvIGl0ZW1zUGVyV3JhcEdyb3VwKTtcblxuICAgICAgICBsZXQgc2Nyb2xsTGVuZ3RoID0gMDtcblxuICAgICAgICBjb25zdCBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwID0gdGhpcy5ob3Jpem9udGFsID8gZGVmYXVsdENoaWxkV2lkdGggOiBkZWZhdWx0Q2hpbGRIZWlnaHQ7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZVVuZXF1YWxDaGlsZHJlblNpemVzKSB7XG4gICAgICAgICAgICBsZXQgbnVtVW5rbm93bkNoaWxkU2l6ZXMgPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZldyYXBHcm91cHM7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkU2l6ZSA9IHRoaXMud3JhcEdyb3VwRGltZW5zaW9ucy5tYXhDaGlsZFNpemVQZXJXcmFwR3JvdXBbaV0gJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXVt0aGlzLl9jaGlsZFNjcm9sbERpbV07XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGggKz0gY2hpbGRTaXplO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICsrbnVtVW5rbm93bkNoaWxkU2l6ZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzY3JvbGxMZW5ndGggKz0gTWF0aC5yb3VuZChudW1Vbmtub3duQ2hpbGRTaXplcyAqIGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gbnVtYmVyT2ZXcmFwR3JvdXBzICogZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmhlYWRlckVsZW1lbnRSZWYpIHtcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aCArPSB0aGlzLmhlYWRlckVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2aWV3cG9ydExlbmd0aCA9IHRoaXMuaG9yaXpvbnRhbCA/IHZpZXdwb3J0V2lkdGggOiB2aWV3cG9ydEhlaWdodDtcbiAgICAgICAgY29uc3QgbWF4U2Nyb2xsUG9zaXRpb24gPSBNYXRoLm1heChzY3JvbGxMZW5ndGggLSB2aWV3cG9ydExlbmd0aCwgMCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNoaWxkSGVpZ2h0OiBkZWZhdWx0Q2hpbGRIZWlnaHQsXG4gICAgICAgICAgICBjaGlsZFdpZHRoOiBkZWZhdWx0Q2hpbGRXaWR0aCxcbiAgICAgICAgICAgIGl0ZW1Db3VudCxcbiAgICAgICAgICAgIGl0ZW1zUGVyUGFnZSxcbiAgICAgICAgICAgIGl0ZW1zUGVyV3JhcEdyb3VwLFxuICAgICAgICAgICAgbWF4U2Nyb2xsUG9zaXRpb24sXG4gICAgICAgICAgICBwYWdlQ291bnRfZnJhY3Rpb25hbDogcGFnZUNvdW50RnJhY3Rpb25hbCxcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aCxcbiAgICAgICAgICAgIHZpZXdwb3J0TGVuZ3RoLFxuICAgICAgICAgICAgd3JhcEdyb3Vwc1BlclBhZ2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZVBhZGRpbmcoYXJyYXlTdGFydEluZGV4V2l0aEJ1ZmZlcjogbnVtYmVyLCBkaW1lbnNpb25zOiBJRGltZW5zaW9ucyk6IG51bWJlciB7XG4gICAgICAgIGlmIChkaW1lbnNpb25zLml0ZW1Db3VudCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwID0gZGltZW5zaW9uc1t0aGlzLl9jaGlsZFNjcm9sbERpbV07XG4gICAgICAgIGNvbnN0IHN0YXJ0aW5nV3JhcEdyb3VwSW5kZXggPSBNYXRoLmZsb29yKGFycmF5U3RhcnRJbmRleFdpdGhCdWZmZXIgLyBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwKSB8fCAwO1xuXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXAgKiBzdGFydGluZ1dyYXBHcm91cEluZGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG51bVVua25vd25DaGlsZFNpemVzID0gMDtcbiAgICAgICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhcnRpbmdXcmFwR3JvdXBJbmRleDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZFNpemUgPSB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2ldICYmXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXVt0aGlzLl9jaGlsZFNjcm9sbERpbV07XG4gICAgICAgICAgICBpZiAoY2hpbGRTaXplKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IGNoaWxkU2l6ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKytudW1Vbmtub3duQ2hpbGRTaXplcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gTWF0aC5yb3VuZChudW1Vbmtub3duQ2hpbGRTaXplcyAqIGRlZmF1bHRTY3JvbGxMZW5ndGhQZXJXcmFwR3JvdXApO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGNhbGN1bGF0ZVBhZ2VJbmZvKHNjcm9sbFBvc2l0aW9uOiBudW1iZXIsIGRpbWVuc2lvbnM6IElEaW1lbnNpb25zKTogSVBhZ2VJbmZvIHtcbiAgICAgICAgbGV0IHNjcm9sbFBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVVbmVxdWFsQ2hpbGRyZW5TaXplcykge1xuICAgICAgICAgICAgY29uc3QgbnVtYmVyT2ZXcmFwR3JvdXBzID0gTWF0aC5jZWlsKGRpbWVuc2lvbnMuaXRlbUNvdW50IC8gZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cCk7XG4gICAgICAgICAgICBsZXQgdG90YWxTY3JvbGxlZExlbmd0aCA9IDA7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0U2Nyb2xsTGVuZ3RoUGVyV3JhcEdyb3VwID0gZGltZW5zaW9uc1t0aGlzLl9jaGlsZFNjcm9sbERpbV07XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mV3JhcEdyb3VwczsgKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRTaXplID0gdGhpcy53cmFwR3JvdXBEaW1lbnNpb25zLm1heENoaWxkU2l6ZVBlcldyYXBHcm91cFtpXSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLndyYXBHcm91cERpbWVuc2lvbnMubWF4Q2hpbGRTaXplUGVyV3JhcEdyb3VwW2ldW3RoaXMuX2NoaWxkU2Nyb2xsRGltXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU2Nyb2xsZWRMZW5ndGggKz0gY2hpbGRTaXplO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU2Nyb2xsZWRMZW5ndGggKz0gZGVmYXVsdFNjcm9sbExlbmd0aFBlcldyYXBHcm91cDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsUG9zaXRpb24gPCB0b3RhbFNjcm9sbGVkTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbFBlcmNlbnRhZ2UgPSBpIC8gbnVtYmVyT2ZXcmFwR3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JvbGxQZXJjZW50YWdlID0gc2Nyb2xsUG9zaXRpb24gLyBkaW1lbnNpb25zLnNjcm9sbExlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0YXJ0aW5nQXJyYXlJbmRleEZyYWN0aW9uYWwgPSBNYXRoLm1pbihNYXRoLm1heChzY3JvbGxQZXJjZW50YWdlICogZGltZW5zaW9ucy5wYWdlQ291bnRfZnJhY3Rpb25hbCwgMCksXG4gICAgICAgICAgICBkaW1lbnNpb25zLnBhZ2VDb3VudF9mcmFjdGlvbmFsKSAqIGRpbWVuc2lvbnMuaXRlbXNQZXJQYWdlO1xuXG4gICAgICAgIGNvbnN0IG1heFN0YXJ0ID0gZGltZW5zaW9ucy5pdGVtQ291bnQgLSBkaW1lbnNpb25zLml0ZW1zUGVyUGFnZSAtIDE7XG4gICAgICAgIGxldCBhcnJheVN0YXJ0SW5kZXggPSBNYXRoLm1pbihNYXRoLmZsb29yKHN0YXJ0aW5nQXJyYXlJbmRleEZyYWN0aW9uYWwpLCBtYXhTdGFydCk7XG4gICAgICAgIGFycmF5U3RhcnRJbmRleCAtPSBhcnJheVN0YXJ0SW5kZXggJSBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwOyAvLyByb3VuZCBkb3duIHRvIHN0YXJ0IG9mIHdyYXBHcm91cFxuXG4gICAgICAgIGlmICh0aGlzLnN0cmlwZWRUYWJsZSkge1xuICAgICAgICAgICAgY29uc3QgYnVmZmVyQm91bmRhcnkgPSAyICogZGltZW5zaW9ucy5pdGVtc1BlcldyYXBHcm91cDtcbiAgICAgICAgICAgIGlmIChhcnJheVN0YXJ0SW5kZXggJSBidWZmZXJCb3VuZGFyeSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGFycmF5U3RhcnRJbmRleCA9IE1hdGgubWF4KGFycmF5U3RhcnRJbmRleCAtIGFycmF5U3RhcnRJbmRleCAlIGJ1ZmZlckJvdW5kYXJ5LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhcnJheUVuZEluZGV4ID0gTWF0aC5jZWlsKHN0YXJ0aW5nQXJyYXlJbmRleEZyYWN0aW9uYWwpICsgZGltZW5zaW9ucy5pdGVtc1BlclBhZ2UgLSAxO1xuICAgICAgICBjb25zdCBlbmRJbmRleFdpdGhpbldyYXBHcm91cCA9IChhcnJheUVuZEluZGV4ICsgMSkgJSBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwO1xuICAgICAgICBpZiAoZW5kSW5kZXhXaXRoaW5XcmFwR3JvdXAgPiAwKSB7XG4gICAgICAgICAgICBhcnJheUVuZEluZGV4ICs9IGRpbWVuc2lvbnMuaXRlbXNQZXJXcmFwR3JvdXAgLSBlbmRJbmRleFdpdGhpbldyYXBHcm91cDsgLy8gcm91bmQgdXAgdG8gZW5kIG9mIHdyYXBHcm91cFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzTmFOKGFycmF5U3RhcnRJbmRleCkpIHtcbiAgICAgICAgICAgIGFycmF5U3RhcnRJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzTmFOKGFycmF5RW5kSW5kZXgpKSB7XG4gICAgICAgICAgICBhcnJheUVuZEluZGV4ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmF5U3RhcnRJbmRleCA9IE1hdGgubWluKE1hdGgubWF4KGFycmF5U3RhcnRJbmRleCwgMCksIGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gMSk7XG4gICAgICAgIGFycmF5RW5kSW5kZXggPSBNYXRoLm1pbihNYXRoLm1heChhcnJheUVuZEluZGV4LCAwKSwgZGltZW5zaW9ucy5pdGVtQ291bnQgLSAxKTtcblxuICAgICAgICBjb25zdCBidWZmZXJTaXplID0gdGhpcy5idWZmZXJBbW91bnQgKiBkaW1lbnNpb25zLml0ZW1zUGVyV3JhcEdyb3VwO1xuICAgICAgICBjb25zdCBzdGFydEluZGV4V2l0aEJ1ZmZlciA9IE1hdGgubWluKE1hdGgubWF4KGFycmF5U3RhcnRJbmRleCAtIGJ1ZmZlclNpemUsIDApLCBkaW1lbnNpb25zLml0ZW1Db3VudCAtIDEpO1xuICAgICAgICBjb25zdCBlbmRJbmRleFdpdGhCdWZmZXIgPSBNYXRoLm1pbihNYXRoLm1heChhcnJheUVuZEluZGV4ICsgYnVmZmVyU2l6ZSwgMCksIGRpbWVuc2lvbnMuaXRlbUNvdW50IC0gMSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXJ0SW5kZXg6IGFycmF5U3RhcnRJbmRleCxcbiAgICAgICAgICAgIGVuZEluZGV4OiBhcnJheUVuZEluZGV4LFxuICAgICAgICAgICAgc3RhcnRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICBlbmRJbmRleFdpdGhCdWZmZXIsXG4gICAgICAgICAgICBzY3JvbGxTdGFydFBvc2l0aW9uOiBzY3JvbGxQb3NpdGlvbixcbiAgICAgICAgICAgIHNjcm9sbEVuZFBvc2l0aW9uOiBzY3JvbGxQb3NpdGlvbiArIGRpbWVuc2lvbnMudmlld3BvcnRMZW5ndGgsXG4gICAgICAgICAgICBtYXhTY3JvbGxQb3NpdGlvbjogZGltZW5zaW9ucy5tYXhTY3JvbGxQb3NpdGlvblxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWxjdWxhdGVWaWV3cG9ydCgpOiBJVmlld3BvcnQge1xuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gdGhpcy5jYWxjdWxhdGVEaW1lbnNpb25zKCk7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZ2V0RWxlbWVudHNPZmZzZXQoKTtcblxuICAgICAgICBsZXQgc2Nyb2xsU3RhcnRQb3NpdGlvbiA9IHRoaXMuZ2V0U2Nyb2xsU3RhcnRQb3NpdGlvbigpO1xuICAgICAgICBpZiAoc2Nyb2xsU3RhcnRQb3NpdGlvbiA+IChkaW1lbnNpb25zLnNjcm9sbExlbmd0aCArIG9mZnNldCkgJiYgISh0aGlzLnBhcmVudFNjcm9sbCBpbnN0YW5jZW9mIFdpbmRvdykpIHtcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb24gPSBkaW1lbnNpb25zLnNjcm9sbExlbmd0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb24gLT0gb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbFN0YXJ0UG9zaXRpb24gPSBNYXRoLm1heCgwLCBzY3JvbGxTdGFydFBvc2l0aW9uKTtcblxuICAgICAgICBjb25zdCBwYWdlSW5mbyA9IHRoaXMuY2FsY3VsYXRlUGFnZUluZm8oc2Nyb2xsU3RhcnRQb3NpdGlvbiwgZGltZW5zaW9ucyk7XG4gICAgICAgIGNvbnN0IG5ld1BhZGRpbmcgPSB0aGlzLmNhbGN1bGF0ZVBhZGRpbmcocGFnZUluZm8uc3RhcnRJbmRleFdpdGhCdWZmZXIsIGRpbWVuc2lvbnMpO1xuICAgICAgICBjb25zdCBuZXdTY3JvbGxMZW5ndGggPSBkaW1lbnNpb25zLnNjcm9sbExlbmd0aDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhcnRJbmRleDogcGFnZUluZm8uc3RhcnRJbmRleCxcbiAgICAgICAgICAgIGVuZEluZGV4OiBwYWdlSW5mby5lbmRJbmRleCxcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhXaXRoQnVmZmVyOiBwYWdlSW5mby5zdGFydEluZGV4V2l0aEJ1ZmZlcixcbiAgICAgICAgICAgIGVuZEluZGV4V2l0aEJ1ZmZlcjogcGFnZUluZm8uZW5kSW5kZXhXaXRoQnVmZmVyLFxuICAgICAgICAgICAgcGFkZGluZzogTWF0aC5yb3VuZChuZXdQYWRkaW5nKSxcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aDogTWF0aC5yb3VuZChuZXdTY3JvbGxMZW5ndGgpLFxuICAgICAgICAgICAgc2Nyb2xsU3RhcnRQb3NpdGlvbjogcGFnZUluZm8uc2Nyb2xsU3RhcnRQb3NpdGlvbixcbiAgICAgICAgICAgIHNjcm9sbEVuZFBvc2l0aW9uOiBwYWdlSW5mby5zY3JvbGxFbmRQb3NpdGlvbixcbiAgICAgICAgICAgIG1heFNjcm9sbFBvc2l0aW9uOiBwYWdlSW5mby5tYXhTY3JvbGxQb3NpdGlvblxuICAgICAgICB9O1xuICAgIH1cbn1cblxuQE5nTW9kdWxlKHtcbiAgICBleHBvcnRzOiBbVmlydHVhbFNjcm9sbGVyQ29tcG9uZW50XSxcbiAgICBkZWNsYXJhdGlvbnM6IFtWaXJ0dWFsU2Nyb2xsZXJDb21wb25lbnRdLFxuICAgIGltcG9ydHM6IFtDb21tb25Nb2R1bGVdLFxuICAgIHByb3ZpZGVyczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBwcm92aWRlOiAndmlydHVhbC1zY3JvbGxlci1kZWZhdWx0LW9wdGlvbnMnLFxuICAgICAgICAgICAgdXNlRmFjdG9yeTogVklSVFVBTF9TQ1JPTExFUl9ERUZBVUxUX09QVElPTlNfRkFDVE9SWVxuICAgICAgICB9XG4gICAgXVxufSlcbmV4cG9ydCBjbGFzcyBWaXJ0dWFsU2Nyb2xsZXJNb2R1bGUge1xufVxuIl19