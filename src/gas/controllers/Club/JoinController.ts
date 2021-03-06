import JoinModel from "../../models/Club/JoinModel";
import JoinInterface from "../../shared/types/JoinInterface";

export default class JoinController {
  private model = new JoinModel();

  update(params: JoinInterface) {
    return this.model.addMember(params);
  }
}
