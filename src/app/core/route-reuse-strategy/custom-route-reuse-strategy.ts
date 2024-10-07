import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from "@angular/router";
//https://stackoverflow.com/questions/49155895/how-to-activate-routereusestrategy-only-for-specific-routes
export class CustomRouteReuseStrategy implements RouteReuseStrategy {

  handlers: { [key: string]: DetachedRouteHandle } = {};

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.data.shouldReuse || false;
  }

  store(route: ActivatedRouteSnapshot, handle: {}): void {
    if (route && route.data.shouldReuse && route.routeConfig && route.routeConfig.path) {
      this.handlers[route.routeConfig.path] = handle;
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    let hasHandler: boolean = false;
    if(route && route.routeConfig && route.routeConfig.path){
        hasHandler = !!this.handlers[route.routeConfig.path];
    }
    return !!route.routeConfig && hasHandler;
  }

  retrieve(route: ActivatedRouteSnapshot): {} | null {
    if (!route.routeConfig) 
        return null;
    if(route && route.routeConfig && route.routeConfig.path){
        return this.handlers[route.routeConfig.path];
    }
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.data.shouldReuse || false;
  }

}