import * as os from "os";
export class HostIp {
    public static getIp() {
        // const networkInterfaces = os.networkInterfaces();
        // for (const adapter in networkInterfaces) {
        //     if (adapter === "en0") {
        //         return networkInterfaces[adapter].filter((element) => {
        //             return (element.family === "IPv4");
        //         })[0].address;
        //     }
        // }
        // return undefined;
        return "207.180.205.126";
    }
}
