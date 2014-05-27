/*global describe, it, MM, expect, beforeEach, jasmine, MAPJS, observable*/
describe('Storyboards', function () {
	'use strict';
	var activeContent, mapController, activeContentListener;
	beforeEach(function () {
		activeContent = MAPJS.content({
			title: 'root',
			id: 1,
			attr: {
				'test-storyboards': ['ted talk']
			},
			ideas: {
				1: {id: 11, title: 'not in any storyboards'},
			    2: {id: 12, title: 'already in ted storyboard', attr: {'test-scenes': [{storyboards: {'ted talk': 1}}]}},
			    3: {id: 14, title: 'only in bed storyboard', attr: {'test-scenes': [{storyboards: {'ted talk': 10}}]}},
				4: {id: 13, title: 'in two storyboards', attr: {'test-scenes': [{storyboards: {'ted talk': 2}}]}}
			}
		});
		mapController = observable({});
		activeContentListener = new MM.ActiveContentListener(mapController);
	});

	describe('StoryboardModel', function () {
		var underTest;
		beforeEach(function () {
			underTest = new MM.StoryboardModel(activeContentListener, 'test-storyboards', 'test-scenes');
			mapController.dispatchEvent('mapLoaded', 'loadedMapid', activeContent);
		});
		describe('getActiveStoryboardName', function () {
			it('should return undefined if no storyboards are defined', function () {
				activeContent.updateAttr(1, 'test-storyboards', undefined);
				expect(underTest.getActiveStoryboardName()).toBeUndefined();
			});
			it('should return the first storyboard name by default', function () {
				expect(underTest.getActiveStoryboardName()).toEqual('ted talk');
			});
		});
		describe('setInputEnabled', function () {
			var listener = jasmine.createSpy('listener');
			beforeEach(function () {
				underTest.addEventListener('inputEnabled', listener);
			});
			it('should dispatch an InputEnabled event when true', function () {
				underTest.setInputEnabled(true);
				expect(listener).toHaveBeenCalledWith(true);
			});
			it('should dispatch an InputEnabled event when false', function () {
				underTest.setInputEnabled(false);
				expect(listener).toHaveBeenCalledWith(false);
			});
		});
		describe('getIsInputEnabled', function () {
			it('should be false to begin with', function () {
				expect(underTest.getInputEnabled()).toBeFalsy();
			});
			it('should be true when set', function () {
				underTest.setInputEnabled(true);
				expect(underTest.getInputEnabled()).toBe(true);
			});
		});
		describe('createStoryboard', function () {
			it('should add the new storyboard name to the list of storyboards', function () {
				activeContent.updateAttr(1, 'test-storyboards', undefined);
				underTest.createStoryboard();
				expect(activeContent.getAttrById(1, 'test-storyboards')).toEqual(['Storyboard 1']);
			});
			it('should return the new storyboard name', function () {
				activeContent.updateAttr(1, 'test-storyboards', undefined);
				expect(underTest.createStoryboard()).toEqual('Storyboard 1');
			});
			it('should make the new storyboard active', function () {
				activeContent.updateAttr(1, 'test-storyboards', ['mickey mouse', 'donald duck']);
				underTest.createStoryboard();
				expect(underTest.getActiveStoryboardName()).toEqual('Storyboard 3');
			});
			it('should name the new storyboard Story Board X, incrementing the counter', function () {
				activeContent.updateAttr(1, 'test-storyboards', ['mickey mouse', 'donald duck']);
				var first = underTest.createStoryboard(),
					second = underTest.createStoryboard();
				expect(first).toBe('Storyboard 3');
				expect(second).toBe('Storyboard 4');
			});
			it('should skip over any counters in the same format as autogenerated, to avoid conflicts', function () {
				activeContent.updateAttr(1, 'test-storyboards', ['Storyboard 5', 'donald duck']);
				expect(underTest.createStoryboard()).toBe('Storyboard 6');
			});
		});
		describe('nextSceneIndex', function () {
			it('returns 1 for non existent storyboards', function () {
				activeContent.updateAttr(1, 'test-storyboards', undefined);
				expect(underTest.nextSceneIndex()).toBe(1);
			});
			it('returns max index + 1 for non empty storyboards', function () {
				expect(underTest.nextSceneIndex()).toBe(11);
			});
		});
		describe('getScenesForNodeId', function () {
			it('retrieves the value of the scenes attr', function () {
				expect(underTest.getScenesForNodeId(11)).toEqual([]);
				expect(underTest.getScenesForNodeId(12)).toEqual([{storyboards: {'ted talk': 1}}]);
				expect(underTest.getScenesForNodeId(13)).toEqual([{storyboards: {'ted talk': 2}}]);
			});
		});
		describe('setScenesForNodeId', function () {
			it('sets the value of the scenes attr', function () {
				underTest.setScenesForNodeId(12, [{storyboards: {'xed talk': 5}}]);
				expect(activeContent.getAttrById(12, 'test-scenes')).toEqual([{storyboards: {'xed talk': 5}}]);
			});
		});
		describe('insertionIndexAfter', function () {
			it('should return false if there is no active storyboard', function () {
				activeContent.updateAttr(1, 'test-storyboards', undefined);
				expect(underTest.insertionIndexAfter(1)).toBeFalsy();
			});
			it('should return false if the active storyboard is empty is no active storyboard', function () {
				activeContent.updateAttr(1, 'test-storyboards', ['xed talk']);
				expect(underTest.insertionIndexAfter(1)).toBeFalsy();
			});
			it('calculates the arithmetic median if the index is not the last in the list', function () {
				expect(underTest.insertionIndexAfter(1)).toBe(1.5);
				expect(underTest.insertionIndexAfter(2)).toBe(6);
			});
			it('calculates the arithmetic median between 0 and the first item if the index is undefined', function () {
				expect(underTest.insertionIndexAfter()).toBe(0.5);
			});
			it('adds 1 to the max index if the argument is the last in the list', function () {
				expect(underTest.insertionIndexAfter(10)).toBe(11);
			});
			it('returns false if the index is not in the list', function () {
				expect(underTest.insertionIndexAfter(11)).toBeFalsy();
			});
		});
		describe('getScenes', function () {
			it('retrieves a list of scenes', function () {
				expect(underTest.getScenes()).toEqual([
					{ideaId: 12, title: 'already in ted storyboard', index: 1},
					{ideaId: 13, title: 'in two storyboards', index: 2},
					{ideaId: 14, title: 'only in bed storyboard', index: 10}
				]);
			});
			it('should return an empty array if there are no storyboards', function () {
				activeContent.updateAttr(1, 'test-storyboards', undefined);
				expect(underTest.getScenes()).toEqual([]);
			});
		});
	});

});
