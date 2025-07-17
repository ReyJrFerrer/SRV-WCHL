
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";

module {
    // User types
    public type UserRole = {
        #Client;
        #ServiceProvider;
    };

    public type ProfileImage = {
        imageUrl: Text;
        thumbnailUrl: Text;
    };

    public type Profile = {
        id: Principal;
        name: Text;
        phone: Text;
        role: UserRole;
        createdAt: Time.Time;
        updatedAt: Time.Time;
        isVerified: Bool;
        profilePicture: ?ProfileImage;
        biography: ?Text;
    };

    // API Response
    public type Result<T> = {
        #ok: T;
        #err: Text;
    };
}
