angular.module('ImgCache', [])

.provider('ImgCache', function() {

    ImgCache.$init = function() {

        ImgCache.init(function() {
            ImgCache.$deferred.resolve();
        }, function() {
            ImgCache.$deferred.reject();
        });
    };

    this.manualInit = false;

    this.setOptions = function(options) {
        angular.extend(ImgCache.options, options);
    };

    this.setOption = function(name, value) {
        ImgCache.options[name] = value;
    };

    this.$get = ['$q', function ($q) {

        ImgCache.$deferred = $q.defer();
        ImgCache.$promise = ImgCache.$deferred.promise;

        if(!this.manualInit) {
            ImgCache.$init();
        }

        return ImgCache;
    }];

})

.directive('imgCache', ['ImgCache', '$q', function(ImgCache, $q) {

    var cacheLock = {};

    return {
        restrict: 'A',
        link: function(scope, el, attrs) {

            var setImg = function(type, el, src) {

                ImgCache.getCachedFileURL(src, function(src, dest) {

                    if(type === 'bg') {
                        el.css({'background-image': 'url(' + dest + ')' });
                    } else {
                        el.attr('src', dest);
                    }
                });
            };

            var loadImg = function(type, el, src) {
                // serialize images of the same src
                if (!angular.isDefined(cacheLock[src])) {
                    var defer = $q.defer();
                    cacheLock[src] = defer.promise;

                    var clearLock = function(src) {
                        defer.resolve(src);
                        delete cacheLock[src];
                    };

                    ImgCache.$promise.then(
                        function() {
                            ImgCache.isCached(src, function(path, success) {
                                if (success) {
                                    setImg(type, el, src);
                                    clearLock(src);
                                } else {
                                    ImgCache.cacheFile(src, function() {
                                        setImg(type, el, src);
                                        clearLock(src);
                                    });
                                }
                            });
                        },
                        function() {
                            clearLock(src);
                        }
                    );

                } else {
                    cacheLock[src].then(function(src) {
                        setImg(type, el, src);
                    });
                }

            };

            attrs.$observe('icSrc', function(src) {
                if (src) {
                    loadImg('src', el, src);
                }
            });

            attrs.$observe('icBg', function(src) {
                if (src) {
                    loadImg('bg', el, src);
                }
            });

        }
    };
}]);
