import JoinInterface from "../../shared/types/JoinInterface";
import JoinView from "../../views/Club/JoinView";

export default class JoinModel {
  private view = new JoinView();

  addMember(params: JoinInterface) {
    // FIXME
    // @ts-ignore
    return this.view.provide(params);
  }
}
