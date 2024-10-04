import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from "@angular/router";

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