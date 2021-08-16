/// <reference types="tween.js" />
import { ChangeDetectorRef, DoCheck, ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import * as tween from '@tweenjs/tween.js';
export interface VirtualScrollerDefaultOptions {
    checkResizeInterval: number;
    modifyOverflowStyleOfParentScroll: boolean;
    resizeBypassRefreshThreshold: number;
    scrollAnimationTime: number;
    scrollDebounceTime: number;
    scrollThrottlingTime: number;
    scrollbarHeight?: number;
    scrollbarWidth?: number;
    stripedTable: boolean;
}
export declare function VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY(): VirtualScrollerDefaultOptions;
export interface WrapGroupDimensions {
    maxChildSizePerWrapGroup: WrapGroupDimension[];
    numberOfKnownWrapGroupChildSizes: number;
    sumOfKnownWrapGroupChildHeights: number;
    sumOfKnownWrapGroupChildWidths: number;
}
export interface WrapGroupDimension {
    childHeight: number;
    childWidth: number;
    items: any[];
}
export interface IDimensions {
    childHeight: number;
    childWidth: number;
    itemCount: number;
    itemsPerPage: number;
    itemsPerWrapGroup: number;
    maxScrollPosition: number;
    pageCount_fractional: number;
    scrollLength: number;
    viewportLength: number;
    wrapGroupsPerPage: number;
}
export interface IPageInfo {
    endIndex: number;
    endIndexWithBuffer: number;
    maxScrollPosition: number;
    scrollEndPosition: number;
    scrollStartPosition: number;
    startIndex: number;
    startIndexWithBuffer: number;
}
export interface IViewport extends IPageInfo {
    padding: number;
    scrollLength: number;
}
export declare class VirtualScrollerComponent implements OnInit, OnChanges, OnDestroy, DoCheck {
    protected readonly element: ElementRef;
    protected readonly renderer: Renderer2;
    protected readonly zone: NgZone;
    protected changeDetectorRef: ChangeDetectorRef;
    get viewPortInfo(): IPageInfo;
    get enableUnequalChildrenSizes(): boolean;
    set enableUnequalChildrenSizes(value: boolean);
    get bufferAmount(): number;
    set bufferAmount(value: number);
    get scrollThrottlingTime(): number;
    set scrollThrottlingTime(value: number);
    get scrollDebounceTime(): number;
    set scrollDebounceTime(value: number);
    get checkResizeInterval(): number;
    set checkResizeInterval(value: number);
    get items(): any[];
    set items(value: any[]);
    get horizontal(): boolean;
    set horizontal(value: boolean);
    get parentScroll(): Element | Window;
    set parentScroll(value: Element | Window);
    constructor(element: ElementRef, renderer: Renderer2, zone: NgZone, changeDetectorRef: ChangeDetectorRef, platformId: Object, options: VirtualScrollerDefaultOptions);
    viewPortItems: any[];
    window: Window & typeof globalThis;
    executeRefreshOutsideAngularZone: boolean;
    protected _enableUnequalChildrenSizes: boolean;
    RTL: boolean;
    useMarginInsteadOfTranslate: boolean;
    modifyOverflowStyleOfParentScroll: boolean;
    stripedTable: boolean;
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    ssrChildWidth: number;
    ssrChildHeight: number;
    ssrViewportWidth: number;
    ssrViewportHeight: number;
    protected _bufferAmount: number;
    scrollAnimationTime: number;
    resizeBypassRefreshThreshold: number;
    protected _scrollThrottlingTime: number;
    protected _scrollDebounceTime: number;
    protected onScroll: () => void;
    protected checkScrollElementResizedTimer: number;
    protected _checkResizeInterval: number;
    protected _items: any[];
    protected _horizontal: boolean;
    protected oldParentScrollOverflow: {
        x: string;
        y: string;
    };
    protected _parentScroll: Element | Window;
    vsUpdate: EventEmitter<any[]>;
    vsChange: EventEmitter<IPageInfo>;
    vsStart: EventEmitter<IPageInfo>;
    vsEnd: EventEmitter<IPageInfo>;
    protected contentElementRef: ElementRef;
    protected invisiblePaddingElementRef: ElementRef;
    protected headerElementRef: ElementRef;
    protected containerElementRef: ElementRef;
    protected isAngularUniversalSSR: boolean;
    protected previousScrollBoundingRect: ClientRect;
    protected _invisiblePaddingProperty: any;
    protected _offsetType: any;
    protected _scrollType: any;
    protected _pageOffsetType: any;
    protected _childScrollDim: any;
    protected _translateDir: any;
    protected _marginDir: any;
    protected calculatedScrollbarWidth: number;
    protected calculatedScrollbarHeight: number;
    protected padding: number;
    protected previousViewPort: IViewport;
    protected currentTween: tween.Tween;
    protected cachedItemsLength: number;
    protected disposeScrollHandler: () => void | undefined;
    protected disposeResizeHandler: () => void | undefined;
    protected minMeasuredChildWidth: number;
    protected minMeasuredChildHeight: number;
    protected wrapGroupDimensions: WrapGroupDimensions;
    protected cachedPageSize: number;
    protected previousScrollNumberElements: number;
    protected updateOnScrollFunction(): void;
    compareItems: (item1: any, item2: any) => boolean;
    protected revertParentOverscroll(): void;
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: any): void;
    ngDoCheck(): void;
    refresh(): void;
    invalidateAllCachedMeasurements(): void;
    invalidateCachedMeasurementForItem(item: any): void;
    invalidateCachedMeasurementAtIndex(index: number): void;
    scrollInto(item: any, alignToBeginning?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    scrollToIndex(index: number, alignToBeginning?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    protected scrollToIndex_internal(index: number, alignToBeginning?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    scrollToPosition(scrollPosition: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    protected getElementSize(element: HTMLElement): ClientRect;
    protected checkScrollElementResized(): void;
    protected updateDirection(): void;
    protected debounce(func: () => any, wait: number): () => any;
    protected throttleTrailing(func: () => any, wait: number): () => any;
    protected refresh_internal(itemsArrayModified: boolean, refreshCompletedCallback?: () => void, maxRunTimes?: number): void;
    protected getScrollElement(): HTMLElement;
    protected addScrollEventHandlers(): void;
    protected removeScrollEventHandlers(): void;
    protected getElementsOffset(): number;
    protected countItemsPerWrapGroup(): number;
    protected getScrollStartPosition(): number;
    protected resetWrapGroupDimensions(): void;
    protected calculateDimensions(): IDimensions;
    protected calculatePadding(arrayStartIndexWithBuffer: number, dimensions: IDimensions): number;
    protected calculatePageInfo(scrollPosition: number, dimensions: IDimensions): IPageInfo;
    protected calculateViewport(): IViewport;
}
export declare class VirtualScrollerModule {
}
