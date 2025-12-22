import { createDefine } from "fresh";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  shared: string;
}

export const define = createDefine<State>();

export const SITE_TITLE = "Pacientes Eguzkilore";

export interface RouteContext<T = unknown> {
  render(data: T): Response | Promise<Response>;
  req: Request;
  params: Record<string, string>;
}
