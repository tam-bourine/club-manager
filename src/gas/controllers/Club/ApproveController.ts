import Response from "../../shared/Response";
import ApproveInterface from "../../types/ApproveInterface";

export default class ApproveController {
  private res = new Response();

  create(params: ApproveInterface) {
    return {
      status: 200,
      message: "200 OK",
    };
  }

  update(params: ApproveInterface) {
    return {
      status: 200,
      message: "200 OK",
    };
  }
}
